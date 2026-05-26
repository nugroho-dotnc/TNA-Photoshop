// src/components/common/Tabs.tsx
import React from 'react'

interface Tab {
  key: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-surface-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
            activeTab === tab.key
              ? 'border-accent text-text-primary'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
