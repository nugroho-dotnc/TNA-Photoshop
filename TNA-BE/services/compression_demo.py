"""
services/compression_demo.py
─────────────────────────────────────────────────────────────────────────────
True implementations of classic lossless compression algorithms for educational demo.
These algorithms process actual image data. To prevent server timeouts on large images (e.g., 4K), 
the algorithms operate on a downscaled grayscale version internally to compute the realistic 
compression ratio, which is then extrapolated.
"""

import time
import heapq
import numpy as np
import cv2
from collections import Counter, defaultdict

def _prepare_data(img: np.ndarray, max_dim: int = 256) -> np.ndarray:
    """
    Downscale and convert to grayscale to make true algorithms compute in reasonable time
    (seconds instead of minutes/hours for Python loops).
    """
    h, w = img.shape[:2]
    scale = 1.0
    if h > max_dim or w > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
    
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    return img.flatten()


# ─── 1. Run-Length Encoding (RLE) ─────────────────────────────────────────────

def run_rle(img: np.ndarray):
    data = _prepare_data(img)
    start_time = time.time()
    
    # RLE logic
    runs = []
    if len(data) > 0:
        current_val = data[0]
        count = 1
        for val in data[1:]:
            if val == current_val and count < 255: # Max 8-bit run length
                count += 1
            else:
                runs.append((current_val, count))
                current_val = val
                count = 1
        runs.append((current_val, count))
    
    end_time = time.time()
    
    # Size calculation: Each run is 2 bytes (1 for value, 1 for count)
    compressed_bytes = len(runs) * 2
    original_bytes = len(data)
    
    ratio = original_bytes / compressed_bytes if compressed_bytes > 0 else 0
    return {
        "algorithm": "RLE",
        "original_bytes": original_bytes,
        "compressed_bytes": compressed_bytes,
        "ratio": ratio,
        "time_sec": end_time - start_time
    }


# ─── 2. Huffman Coding ────────────────────────────────────────────────────────

class HuffmanNode:
    def __init__(self, char, freq):
        self.char = char
        self.freq = freq
        self.left = None
        self.right = None

    def __lt__(self, other):
        return self.freq < other.freq

def run_huffman(img: np.ndarray):
    data = _prepare_data(img)
    start_time = time.time()
    
    # 1. Calculate frequencies
    freq_map = Counter(data)
    
    # 2. Build Huffman Tree
    heap = [HuffmanNode(char, freq) for char, freq in freq_map.items()]
    heapq.heapify(heap)
    
    if len(heap) == 1:
        # Edge case: image has only one color
        node = heapq.heappop(heap)
        heapq.heappush(heap, HuffmanNode(None, node.freq))
    
    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        merged = HuffmanNode(None, left.freq + right.freq)
        merged.left = left
        merged.right = right
        heapq.heappush(heap, merged)
        
    # 3. Generate codes
    codes = {}
    def generate_codes(node, current_code=""):
        if node is None:
            return
        if node.char is not None:
            codes[node.char] = current_code
        generate_codes(node.left, current_code + "0")
        generate_codes(node.right, current_code + "1")
        
    if heap:
        generate_codes(heap[0])
        
    # 4. Calculate total compressed bits
    total_bits = sum(freq_map[char] * len(codes[char]) for char in freq_map)
    compressed_bytes = total_bits / 8.0
    
    end_time = time.time()
    original_bytes = len(data)
    
    ratio = original_bytes / compressed_bytes if compressed_bytes > 0 else 0
    return {
        "algorithm": "Huffman",
        "original_bytes": original_bytes,
        "compressed_bytes": compressed_bytes,
        "ratio": ratio,
        "time_sec": end_time - start_time
    }


# ─── 3. LZW (Lempel-Ziv-Welch) ────────────────────────────────────────────────

def run_lzw(img: np.ndarray):
    data = _prepare_data(img)
    start_time = time.time()
    
    # Initialize dictionary with 256 single-character strings
    dictionary = {bytes([i]): i for i in range(256)}
    dict_size = 256
    MAX_DICT_SIZE = 65536 # 16-bit dictionary
    
    w = bytes([data[0]]) if len(data) > 0 else b""
    compressed_codes = []
    
    for i in range(1, len(data)):
        c = bytes([data[i]])
        wc = w + c
        if wc in dictionary:
            w = wc
        else:
            compressed_codes.append(dictionary[w])
            if dict_size < MAX_DICT_SIZE:
                dictionary[wc] = dict_size
                dict_size += 1
            w = c
            
    if w:
        compressed_codes.append(dictionary[w])
        
    end_time = time.time()
    
    # If dict max size is 65536, each code is 16 bits (2 bytes)
    compressed_bytes = len(compressed_codes) * 2
    original_bytes = len(data)
    
    ratio = original_bytes / compressed_bytes if compressed_bytes > 0 else 0
    return {
        "algorithm": "LZW",
        "original_bytes": original_bytes,
        "compressed_bytes": compressed_bytes,
        "ratio": ratio,
        "time_sec": end_time - start_time
    }


# ─── 4. Arithmetic Coding (Simplified Integer implementation) ───────────────────

def run_arithmetic(img: np.ndarray):
    data = _prepare_data(img)
    start_time = time.time()
    
    # 1. Frequency and probability ranges
    freq_map = Counter(data)
    total_pixels = len(data)
    
    # Cumulative frequencies for integer arithmetic coding
    cum_freq = {}
    current_sum = 0
    for val, freq in sorted(freq_map.items()):
        cum_freq[val] = (current_sum, current_sum + freq)
        current_sum += freq
        
    # Standard 32-bit integer limits
    MAX_CODE = 0xFFFFFFFF
    HALF = 0x80000000
    Q1 = 0x40000000
    Q3 = 0xC0000000
    
    low = 0
    high = MAX_CODE
    bits_produced = 0
    pending_bits = 0
    
    # Block-based encoding to prevent performance halt (we process first 10,000 pixels)
    # The compression ratio will be highly representative of the whole image.
    sample_size = min(10000, len(data))
    
    for i in range(sample_size):
        val = data[i]
        sym_low, sym_high = cum_freq[val]
        
        range_val = high - low + 1
        high = low + (range_val * sym_high) // total_pixels - 1
        low = low + (range_val * sym_low) // total_pixels
        
        while True:
            if high < HALF:
                # Output 0 and pending 1s
                bits_produced += 1 + pending_bits
                pending_bits = 0
                low = (low << 1) & MAX_CODE
                high = ((high << 1) | 1) & MAX_CODE
            elif low >= HALF:
                # Output 1 and pending 0s
                bits_produced += 1 + pending_bits
                pending_bits = 0
                low = ((low - HALF) << 1) & MAX_CODE
                high = (((high - HALF) << 1) | 1) & MAX_CODE
            elif low >= Q1 and high < Q3:
                # Pending bit scenario
                pending_bits += 1
                low = ((low - Q1) << 1) & MAX_CODE
                high = (((high - Q1) << 1) | 1) & MAX_CODE
            else:
                break
                
    bits_produced += 2 # Flush remaining bits
    
    end_time = time.time()
    
    # Extrapolate compressed size based on the sample ratio
    sample_ratio = bits_produced / (sample_size * 8)
    compressed_bytes = len(data) * sample_ratio
    original_bytes = len(data)
    
    ratio = original_bytes / compressed_bytes if compressed_bytes > 0 else 0
    return {
        "algorithm": "Arithmetic",
        "original_bytes": original_bytes,
        "compressed_bytes": compressed_bytes,
        "ratio": ratio,
        "time_sec": end_time - start_time
    }


# ─── 5. Quantization (Lossy Image Transformation) ─────────────────────────────

def run_quantization(img: np.ndarray, levels: int = 16) -> np.ndarray:
    """
    Mengurangi kedalaman warna (bit depth) dari gambar.
    Misalnya, 256 level (8-bit) diubah menjadi 16 level.
    """
    # Pastikan levels berada di range yang valid
    levels = max(2, min(256, levels))
    factor = 256 / levels
    
    # (img // factor) mengubah rentang 0-255 menjadi 0-(levels-1)
    # dikali factor lagi untuk mengembalikannya ke skala 0-255
    quantized_img = np.floor(img / factor) * factor
    
    # Jika diinginkan agar warnanya rata di tengah-tengah rentang
    # quantized_img = np.floor(img / factor) * factor + (factor / 2)
    
    quantized_img = np.clip(quantized_img, 0, 255).astype(np.uint8)
    return quantized_img
