"use client"

import { useEffect, useState } from "react"
import SingleSensorChart from "@/components/grafica-sensor"
import type { ApiPoint, ChartPoint } from "@/types/sensor"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
const MAX_POINTS = 200

type WsPayload = {
  temperatura?: ApiPoint | null
  humedad?: ApiPoint | null
  presion?: ApiPoint | null
  luz?: ApiPoint | null
  gas?: ApiPoint | null
}

const normalizePoint = (point: ApiPoint): ChartPoint => {
  const rawTime = point.time ?? ""
  const isoTime = rawTime && rawTime.includes("T") ? rawTime : rawTime.replace(" ", "T")
  const dateValue = rawTime ? new Date(isoTime) : null

  return {
    id: point.id,
    value: point.value,
    isoTime,
    time: dateValue ? dateValue.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "--:--",
  }
}

async function fetchHistory(
    path: string, 
    setter: (data: ChartPoint[]) => void,
) {
    try{
        const res = await fetch(`${API_BASE}${path}`)
        const json: ApiPoint[] = await res.json()
        const normilized = json.map(normalizePoint)
        setter(normilized.slice(-MAX_POINTS))
    } catch (err) {
        console.error("Error haciendo fetch de", path, err)
    }
}

export default function GraficasPage() {
  const [tempData, setTempData] = useState<ChartPoint[]>([])
  const [humData, setHumData] = useState<ChartPoint[]>([])
  const [presData, setPresData] = useState<ChartPoint[]>([])
  const [luzData, setLuzData] = useState<ChartPoint[]>([])
  const [gasData, setGasData] = useState<ChartPoint[]>([])

  const insertById = (prev: ChartPoint[], p: ChartPoint, maxLen = 200) => {
    if (!p || p.id == null) return prev
    if (prev.length > 0 && prev[prev.length - 1].id === p.id) {
      const copy = prev.slice(0, -1)
      return [...copy, p]
    }
    return [...prev, p].slice(-maxLen)
  }

  useEffect(() => {
    const wsUrl = API_BASE.replace("http", "ws") + "/ws"
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const data: WsPayload = JSON.parse(event.data)

        if (data.temperatura) {
          const p = normalizePoint(data.temperatura as ApiPoint)
          setTempData((prev) => insertById(prev, p))
        }
        if (data.humedad) {
          const p = normalizePoint(data.humedad)
          setHumData((prev) => insertById(prev, p))
        }
        if (data.presion) {
          const p = normalizePoint(data.presion)
          setPresData((prev) => insertById(prev, p))
        }
        if (data.luz) {
          const p = normalizePoint(data.luz)
          setLuzData((prev) => insertById(prev, p))
        }
        if (data.gas) {
          const p = normalizePoint(data.gas)
          setGasData((prev) => insertById(prev, p))
        }
      } catch (err) {
        console.error("Error parseando mensaje de WS (gráficas):", err)
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    fetchHistory("/temperatura?limit=200", setTempData)
    fetchHistory("/humedad?limit=200", setHumData)
    fetchHistory("/presion?limit=200", setPresData)
    fetchHistory("/luz?limit=200", setLuzData)
    fetchHistory("/gas?limit=200", setGasData)
  }, [])

  return (
    <main className="min-h-screen bg-sky-100 p-10">
      <section className="space-y-4 pb-7">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-black">
          Gráficas de sensores
        </h1>
      </section>

      <section className="space-y-3">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <SingleSensorChart
            label="Temperatura"
            unit="°C"
            data={tempData}
            lineColor="#22c55e"
          />

          <SingleSensorChart
            label="Humedad"
            unit="%"
            data={humData}
            lineColor="#0ea5e9"
          />

          <SingleSensorChart
            label="Presión"
            unit="hPa"
            data={presData}
            lineColor="#eab308"
          />

          <SingleSensorChart
            label="Luz"
            unit="%"
            data={luzData}
            lineColor="#a855f7"
          />

          <SingleSensorChart
            label="Gas"
            unit="%"
            data={gasData}
            lineColor="#f97316"
          />
        </div>
      </section>
    </main>
  )
}