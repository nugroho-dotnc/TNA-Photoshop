// src/components/panels/right/HistogramChart.tsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface HistogramChartProps {
  data: {
    grayscale?: number[]
    red?: number[]
    green?: number[]
    blue?: number[]
  }
  channels: { gray: boolean; r: boolean; g: boolean; b: boolean }
}

export default function HistogramChart({ data, channels }: HistogramChartProps) {
  const chartData = Array.from({ length: 256 }, (_, i) => ({
    i,
    gray: data.grayscale?.[i] ?? 0,
    r: data.red?.[i] ?? 0,
    g: data.green?.[i] ?? 0,
    b: data.blue?.[i] ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="i" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, fontSize: 11 }}
          labelFormatter={(l) => `Intensity: ${l}`}
        />
        {channels.gray && (
          <Area type="monotone" dataKey="gray" stroke="#e0e0e0" fill="#e0e0e0" fillOpacity={0.15} strokeWidth={1} dot={false} />
        )}
        {channels.r && (
          <Area type="monotone" dataKey="r" stroke="#f87171" fill="#f87171" fillOpacity={0.15} strokeWidth={1} dot={false} />
        )}
        {channels.g && (
          <Area type="monotone" dataKey="g" stroke="#4ade80" fill="#4ade80" fillOpacity={0.15} strokeWidth={1} dot={false} />
        )}
        {channels.b && (
          <Area type="monotone" dataKey="b" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} strokeWidth={1} dot={false} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
