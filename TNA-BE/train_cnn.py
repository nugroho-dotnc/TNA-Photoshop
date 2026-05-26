import tensorflow as tf
from tensorflow.keras import layers, models
from pathlib import Path

DATASET_DIR = "dataset"
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 10

train_ds = tf.keras.utils.image_dataset_from_directory(
    DATASET_DIR,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATASET_DIR,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
)

class_names = train_ds.class_names
num_classes = len(class_names)

train_ds = train_ds.prefetch(tf.data.AUTOTUNE)
val_ds = val_ds.prefetch(tf.data.AUTOTUNE)

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights="imagenet",
)

base_model.trainable = False

model = models.Sequential([
    layers.Rescaling(1.0 / 255),
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(num_classes, activation="softmax"),
])

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)

model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
)

model.save(MODEL_DIR / "cnn_model.h5")

with open(MODEL_DIR / "labels.txt", "w", encoding="utf-8") as f:
    for name in class_names:
        f.write(name + "\n")

print("Model saved to models/cnn_model.h5")
print("Labels saved to models/labels.txt")