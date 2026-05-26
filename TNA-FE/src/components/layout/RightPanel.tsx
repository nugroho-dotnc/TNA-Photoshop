// src/components/layout/RightPanel.tsx
import React, { useState } from 'react'
import { BarChart2, Layers, Brain } from 'lucide-react'
import Tabs from '../common/Tabs'
import HistogramTab from '../panels/right/HistogramTab'
import ChannelTab from '../panels/right/ChannelTab'
import CnnTab from '../panels/right/CnnTab'

const TABS = [
  { key: 'histogram', label: 'Histogram', icon: <BarChart2 size={13} /> },
  { key: 'channel', label: 'Channel', icon: <Layers size={13} /> },
  { key: 'cnn', label: 'CNN', icon: <Brain size={13} /> },
]

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState('histogram')

  return (
    <div className="w-72 flex-shrink-0 bg-surface-1 border-l border-surface-4 flex flex-col">
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'histogram' && <HistogramTab />}
        {activeTab === 'channel' && <ChannelTab />}
        {activeTab === 'cnn' && <CnnTab />}
      </div>
    </div>
  )
}
