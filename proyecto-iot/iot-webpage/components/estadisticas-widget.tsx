"use client"

import { Card, CardContent } from "@/components/ui/card"

type StatsRowProps = {
  data: { value: number }[] // ChartPoint es compatible estructuralmente
  unit: string
}

type StatsResult = {
  min: number
  max: number
  avg: number
  count: number
}

function computeStats(data: { value: number }[]): StatsResult | null {
  if (data.length === 0) return null

  let min = data[0].value
  let max = data[0].value
  let sum = 0

  for (const p of data) {
    if (p.value < min) min = p.value
    if (p.value > max) max = p.value
    sum += p.value
  }

  const avg = sum / data.length
  return { min, max, avg, count: data.length }
}

export function EstadisticasWidget({ data, unit }: StatsRowProps) {
  const stats = computeStats(data)
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-3 px-3">
          <p className="text-sm font-bold text-white">Mínimo</p>
          <p className="text-sm font-semibold text-slate-50">
            {stats.min.toFixed(1)} {unit}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-3 px-3">
          <p className="text-sm font-bold text-white">Máximo</p>
          <p className="text-sm font-semibold text-slate-50">
            {stats.max.toFixed(1)} {unit}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-3 px-3">
          <p className="text-sm font-bold text-white">Promedio</p>
          <p className="text-sm font-semibold text-slate-50">
            {stats.avg.toFixed(1)} {unit}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-3 px-3">
          <p className="text-sm font-bold text-white">Muestras</p>
          <p className="text-sm font-semibold text-slate-50">
            {stats.count}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}