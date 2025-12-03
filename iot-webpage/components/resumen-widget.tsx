"use client"

import { Card, CardContent } from "@/components/ui/card"

export type SummaryCardProps = {
  label: string
  value: string
  subtitle?: string
  emoji?: string
}

export function ResumenWidget({ label, value, subtitle }: SummaryCardProps) {
  return (
    <Card className="bg-slate-900/70 border-slate-700 shadow-lg shadow-slate-950/40 hover:shadow-slate-950/70 transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="py-4 px-4 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm uppercase tracking-wide text-white">
            {label}
          </span>
          <span className="text-2xl font-semibold text-slate-100 leading-tight">
            {value}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-400">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}