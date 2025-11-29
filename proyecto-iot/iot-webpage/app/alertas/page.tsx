"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

type ApiPoint = {
  id: number
  value: number
  time: string
}

type ChartPoint = {
  id: number
  value: number
  time: string
  isoTime: string
}

type WsPayload = {
  temperatura?: ApiPoint | null
  humedad?: ApiPoint | null
  presion?: ApiPoint | null
  luz?: ApiPoint | null
  gas?: ApiPoint | null
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"

const MAX_POINTS = 200

const normalizePoint = (point: ApiPoint): ChartPoint => {
  const rawTime = point.time ?? ""
  const isoTime =
    rawTime && rawTime.includes("T") ? rawTime : rawTime.replace(" ", "T")
  const dateValue = rawTime ? new Date(isoTime) : null

  const numericValue =
    typeof point.value === "number" ? point.value : Number(point.value)

  return {
    id: point.id,
    value: numericValue,
    isoTime,
    time: dateValue
      ? dateValue.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "--:--",
  }
}

const getLatest = (data: ChartPoint[]) =>
  data.length > 0 ? data[data.length - 1] : null

// --------------------------
// Umbrales de alerta
// --------------------------

type Severity = "ok" | "warning" | "danger"

type SensorKey = "temperatura" | "humedad" | "presion" | "luz" | "gas"

type SensorConfig = {
  key: SensorKey
  label: string
  unit: string
  warningHigh?: number
  dangerHigh?: number
  warningLow?: number
  dangerLow?: number
}

const SENSOR_CONFIGS: SensorConfig[] = [
  {
    key: "temperatura",
    label: "Temperatura",
    unit: "°C",
    warningHigh: 28,
    dangerHigh: 32,
    warningLow: 18,
    dangerLow: 15,
  },
  {
    key: "humedad",
    label: "Humedad",
    unit: "%",
    warningLow: 30,
    dangerLow: 20,
    warningHigh: 70,
    dangerHigh: 85,
  },
  {
    key: "presion",
    label: "Presión",
    unit: "hPa",
    // aquí podría haber umbrales, pero por ahora la consideramos siempre ok
  },
  {
    key: "luz",
    label: "Luz",
    unit: "%",
    warningHigh: 80,
    dangerHigh: 95,
  },
  {
    key: "gas",
    label: "Gas",
    unit: "%",
    warningHigh: 150,
    dangerHigh: 300,
  },
]

type Evaluation = {
  severity: Severity
  message: string
}

function evaluateValue(config: SensorConfig, value: number): Evaluation {
  const { warningHigh, dangerHigh, warningLow, dangerLow, label } = config

  // Altos
  if (dangerHigh !== undefined && value >= dangerHigh) {
    return {
      severity: "danger",
      message: `${label} muy alta`,
    }
  }
  if (warningHigh !== undefined && value >= warningHigh) {
    return {
      severity: "warning",
      message: `${label} elevada`,
    }
  }

  // Bajos
  if (dangerLow !== undefined && value <= dangerLow) {
    return {
      severity: "danger",
      message: `${label} muy baja`,
    }
  }
  if (warningLow !== undefined && value <= warningLow) {
    return {
      severity: "warning",
      message: `${label} fuera de rango`,
    }
  }

  return {
    severity: "ok",
    message: "Dentro de rango",
  }
}

// --------------------------
// Helpers de datos
// --------------------------

async function fetchHistory(
  path: string,
  setter: (data: ChartPoint[]) => void,
) {
  try {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) {
      console.error("Error al hacer fetch de", path, res.status)
      return
    }
    const json: ApiPoint[] = await res.json()
    const normalized = json.map(normalizePoint)
    setter(normalized.slice(-MAX_POINTS))
  } catch (err) {
    console.error("Error haciendo fetch de", path, err)
  }
}

const insertById = (prev: ChartPoint[], p: ChartPoint, maxLen = MAX_POINTS) => {
  if (!p || p.id == null) return prev
  if (prev.length > 0 && prev[prev.length - 1].id === p.id) {
    const copy = prev.slice(0, -1)
    return [...copy, p]
  }
  return [...prev, p].slice(-maxLen)
}

// --------------------------
// Componentes UI simples
// --------------------------

function SeverityBadge({ severity }: { severity: Severity }) {
  const base =
    "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-medium"

  if (severity === "danger") {
    return (
      <span className={`${base} bg-red-500/20 text-red-200 border border-red-500/40`}>
        Peligro
      </span>
    )
  }
  if (severity === "warning") {
    return (
      <span
        className={`${base} bg-amber-500/20 text-amber-100 border border-amber-500/40`}
      >
        Alerta
      </span>
    )
  }
  return (
    <span
      className={`${base} bg-emerald-500/15 text-emerald-100 border border-emerald-500/30`}
    >
      Normal
    </span>
  )
}

type SensorStatusCardProps = {
  label: string
  unit: string
  value: number | null
  time: string | null
  evaluation: Evaluation | null
}

function SensorStatusCard({
  label,
  unit,
  value,
  time,
  evaluation,
}: SensorStatusCardProps) {
  const sev: Severity = evaluation?.severity ?? "ok"

  return (
    <Card className="bg-slate-900/70 border-slate-800 shadow-lg">
      <CardContent className="py-4 px-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {label}
          </span>
          <SeverityBadge severity={sev} />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold text-slate-50">
            {value !== null ? `${value.toFixed(1)} ${unit}` : `-- ${unit}`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            {evaluation ? evaluation.message : "Sin datos suficientes"}
          </span>
          <span>{time ? `Último dato · ${time}` : ""}</span>
        </div>
      </CardContent>
    </Card>
  )
}

type AlertItem = {
  id: string
  sensorLabel: string
  time: string
  value: number
  unit: string
  severity: Severity
  message: string
}

export default function AlertasPage() {
  const [tempData, setTempData] = useState<ChartPoint[]>([])
  const [humData, setHumData] = useState<ChartPoint[]>([])
  const [presData, setPresData] = useState<ChartPoint[]>([])
  const [luzData, setLuzData] = useState<ChartPoint[]>([])
  const [gasData, setGasData] = useState<ChartPoint[]>([])
  const [isOnline, setIsOnline] = useState(false)

  // carga histórica
  useEffect(() => {
    fetchHistory("/temperatura?limit=200", setTempData)
    fetchHistory("/humedad?limit=200", setHumData)
    fetchHistory("/presion?limit=200", setPresData)
    fetchHistory("/luz?limit=200", setLuzData)
    fetchHistory("/gas?limit=200", setGasData)
  }, [])

  // WebSocket para datos nuevos
  useEffect(() => {
    const wsUrl = API_BASE.replace("http", "ws") + "/ws"
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => setIsOnline(true)
    ws.onclose = () => setIsOnline(false)
    ws.onerror = () => setIsOnline(false)

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
        console.error("[Alertas] Error parseando WS:", err)
      }
    }

    return () => ws.close()
  }, [])

  const latestTemp = getLatest(tempData)
  const latestHum = getLatest(humData)
  const latestPres = getLatest(presData)
  const latestLuz = getLatest(luzData)
  const latestGas = getLatest(gasData)

  const tempEval = latestTemp
    ? evaluateValue(
        SENSOR_CONFIGS.find((c) => c.key === "temperatura")!,
        latestTemp.value,
      )
    : null

  const humEval = latestHum
    ? evaluateValue(
        SENSOR_CONFIGS.find((c) => c.key === "humedad")!,
        latestHum.value,
      )
    : null

  const presEval = latestPres
    ? evaluateValue(
        SENSOR_CONFIGS.find((c) => c.key === "presion")!,
        latestPres.value,
      )
    : null

  const luzEval = latestLuz
    ? evaluateValue(
        SENSOR_CONFIGS.find((c) => c.key === "luz")!,
        latestLuz.value,
      )
    : null

  const gasEval = latestGas
    ? evaluateValue(
        SENSOR_CONFIGS.find((c) => c.key === "gas")!,
        latestGas.value,
      )
    : null

  // construir lista de alertas recientes (no solo el último valor)
    const items: AlertItem[] = []

    const pushFromData = (
      config: SensorConfig,
      data: ChartPoint[],
    ) => {
      data.forEach((p) => {
        const evalRes = evaluateValue(config, p.value)
        if (evalRes.severity === "ok") return
        items.push({
          id: `${config.key}-${p.id}`,
          sensorLabel: config.label,
          time: p.time,
          value: p.value,
          unit: config.unit,
          severity: evalRes.severity,
          message: evalRes.message,
        })
      })
    }

    const cfgTemp = SENSOR_CONFIGS.find((c) => c.key === "temperatura")!
    const cfgHum = SENSOR_CONFIGS.find((c) => c.key === "humedad")!
    const cfgLuz = SENSOR_CONFIGS.find((c) => c.key === "luz")!
    const cfgGas = SENSOR_CONFIGS.find((c) => c.key === "gas")!

    pushFromData(cfgTemp, tempData.slice(-80))
    pushFromData(cfgHum, humData.slice(-80))
    pushFromData(cfgLuz, luzData.slice(-80))
    pushFromData(cfgGas, gasData.slice(-80))

    // ordenamos por "reciente" usando el id (asumiendo autoincremental)
    items.sort((a, b) => (a.id < b.id ? 1 : -1))

  return (
    <main className="min-h-screen bg-sky-100 p-10">
      {/* Header */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-black">
            Alertas de la casa inteligente
          </h1>
          <p className="text-sm text-slate-700">
            Revisión de valores fuera de rango para temperatura, humedad, luz y gas.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                isOnline ? "bg-emerald-400" : "bg-red-500"
              } shadow-[0_0_12px_rgba(16,185,129,0.7)]`}
            />
            <span>{isOnline ? "En línea" : "Desconectado"}</span>
          </div>
        </div>
      </section>

      {/* Estado actual por sensor */}
      <section className="space-y-3 pt-7"> 
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <SensorStatusCard
            label="Temperatura"
            unit="°C"
            value={latestTemp?.value ?? null}
            time={latestTemp?.time ?? null}
            evaluation={tempEval}
          />
          <SensorStatusCard
            label="Humedad"
            unit="%"
            value={latestHum?.value ?? null}
            time={latestHum?.time ?? null}
            evaluation={humEval}
          />
          <SensorStatusCard
            label="Presión"
            unit="hPa"
            value={latestPres?.value ?? null}
            time={latestPres?.time ?? null}
            evaluation={presEval}
          />
          <SensorStatusCard
            label="Luz"
            unit="%"
            value={latestLuz?.value ?? null}
            time={latestLuz?.time ?? null}
            evaluation={luzEval}
          />
          <SensorStatusCard
            label="Gas"
            unit="%"
            value={latestGas?.value ?? null}
            time={latestGas?.time ?? null}
            evaluation={gasEval}
          />
        </div>
      </section>
    </main>
  )
}