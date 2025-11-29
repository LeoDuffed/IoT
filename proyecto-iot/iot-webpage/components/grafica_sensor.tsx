"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import type { ChartPoint } from "@/types/sensor"


export type SingleSensorChartProps = {
  label: string
  unit: string
  data: ChartPoint[]
  lineColor: string
}

export default function SingleSensorChart({
  label,
  unit,
  data,
  lineColor,
}: SingleSensorChartProps) {
  return (
    <Card className="bg-slate-900/70 border-slate-800 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-slate-200">
            {label} ({unit})
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="h-60">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            Esperando datos...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} width={40} />

              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #1f2937",
                  fontSize: 12,
                  backgroundColor: "#020617",
                  color: "#e5e7eb",
                }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}