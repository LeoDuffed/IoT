"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

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

const normalizePoint = (point: ApiPoint): ChartPoint => {
  const rawTime = point.time ?? ""
  const isoTime =
    rawTime && rawTime.includes("T") ? rawTime : rawTime.replace(" ", "T")
  const dateValue = rawTime ? new Date(isoTime) : null

  return {
    id: point.id,
    value: point.value,
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

// Helpers de frontend para stats / últimos valores
const getLatest = (data: ChartPoint[]) =>
  data.length > 0 ? data[data.length - 1] : null

const computeStats = (data: ChartPoint[]) => {
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

type SummaryCardProps = {
  label: string
  value: string
  subtitle?: string
  emoji?: string
}

function SummaryCard({ label, value, subtitle }: SummaryCardProps) {
  return (
    <Card className="bg-slate-900/70 border-slate-700 shadow-lg shadow-slate-950/40 hover:shadow-slate-950/70 transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="py-4 px-4 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {label}
          </span>
          <span className="text-2xl font-semibold text-slate-50 leading-tight">
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

type StatsRowProps = {
  data: ChartPoint[]
  unit: string
}

function StatsRow({ data, unit }: StatsRowProps) {
  const stats = computeStats(data)
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-3 px-3">
          <p className="text-xs text-slate-400">Mínimo</p>
          <p className="text-sm font-semibold text-slate-50">
            {stats.min.toFixed(1)} {unit}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-3 px-3">
          <p className="text-xs text-slate-400">Máximo</p>
          <p className="text-sm font-semibold text-slate-50">
            {stats.max.toFixed(1)} {unit}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-3 px-3">
          <p className="text-xs text-slate-400">Promedio</p>
          <p className="text-sm font-semibold text-slate-50">
            {stats.avg.toFixed(1)} {unit}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-3 px-3">
          <p className="text-xs text-slate-400">Muestras</p>
          <p className="text-sm font-semibold text-slate-50">
            {stats.count}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Home() {
  const [humData, setHumData] = useState<ChartPoint[]>([])
  const [tempData, setTempData] = useState<ChartPoint[]>([])
  const [presData, setPresData] = useState<ChartPoint[]>([])
  const [luzData, setLuzData] = useState<ChartPoint[]>([])
  const [gasData, setGasData] = useState<ChartPoint[]>([])

  const [isOnline, setIsOnline] = useState(false)
  const [now, setNow] = useState<Date | null>(null)

  const insertById = (prev: ChartPoint[], p: ChartPoint, maxLen = 200) => {
    if (!p || p.id == null) return prev
    if (prev.length > 0 && prev[prev.length - 1].id === p.id) {
      const copy = prev.slice(0, -1)
      return [...copy, p]
    }
    return [...prev, p].slice(-maxLen)
  }

  useEffect(() => {
    // Reloj simple para el header
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const wsUrl = API_BASE.replace("http", "ws") + "/ws"
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsOnline(true)
    }

    ws.onclose = () => {
      setIsOnline(false)
    }

    ws.onerror = () => {
      setIsOnline(false)
    }

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
        console.error("Error parseando mensaje de WS:", err)
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const latestTemp = getLatest(tempData)
  const latestHum = getLatest(humData)
  const latestPres = getLatest(presData)
  const latestLuz = getLatest(luzData)
  const latestGas = getLatest(gasData)

  const formattedNow =
    now &&
    now.toLocaleString("es-MX", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <main className="min-h-screen bg-sky-100 text-slate-50">
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r border-slate-600 bg-slate-950/80 backdrop-blur">
          <div className="px-5 py-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-2xl bg-pink-400 flex items-center justify-center text-xl">
                🏠
              </div>
              <div>
                <p className="text-xs text-slate-400">Proyecto IoT</p>
                <p className="text-sm font-semibold text-slate-50">
                  Casa inteligente
                </p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-1 text-sm text-slate-300">
            <button className="w-full text-left px-3 py-2 rounded-xl bg-slate-900 text-slate-50 font-medium">
              Dashboard
            </button>
            <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-900/60">
              Gráficas
            </button>
            <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-900/60">
              Alertas
            </button>
          </nav>
          <div className="px-4 py-4 text-xs text-slate-500">
            <p>Hecho por Duffed</p>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1">
          <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
            {/* Header / Hero */}
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-black">
                  Casa inteligente Umisumi
                </h1>
                <p className="text-sm text-slate-700">
                  Monitoreando temperatura, humedad, presión, luz y gas en
                  tiempo real.
                </p>
                {formattedNow && (
                  <p className="text-xs text-slate-800 mt-1 capitalize">
                    {formattedNow}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-2.5 w-2.5 rounded-full ${
                      isOnline ? "bg-emerald-400" : "bg-red-500"
                    } shadow-[0_0_12px_rgba(16,185,129,0.7)]`}
                  />
                  <span className="text-xs font-medium text-black">
                    {isOnline ? "En línea · LIVE" : "Desconectado"}
                  </span>
                </div>
              </div>
            </header>

            <Separator className="bg-slate-800" />

            {/* Tarjetas resumen principales */}
            <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                label="Temperatura"
                value={
                  latestTemp
                    ? `${latestTemp.value.toFixed(1)} °C`
                    : "-- °C"
                }
                subtitle={
                  latestTemp ? `Último dato · ${latestTemp.time}` : "Sin datos"
                }
              />
              <SummaryCard
                label="Humedad"
                value={
                  latestHum ? `${latestHum.value.toFixed(1)} %` : "-- %"
                }
                subtitle={
                  latestHum ? `Último dato · ${latestHum.time}` : "Sin datos"
                }
              />
              <SummaryCard
                label="Presión"
                value={
                  latestPres
                    ? `${latestPres.value.toFixed(1)} hPa`
                    : "-- hPa"
                }
                subtitle={
                  latestPres ? `Último dato · ${latestPres.time}` : "Sin datos"
                }
              />
              <SummaryCard
                label="Luz"
                value={
                  latestLuz ? `${latestLuz.value.toFixed(1)} %` : "-- %"
                }
                subtitle={
                  latestLuz ? `Último dato · ${latestLuz.time}` : "Sin datos"
                }
              />
              <SummaryCard
                label="Gas"
                value={
                  latestGas ? `${latestGas.value.toFixed(1)} %` : "-- %"
                }
                subtitle={
                  latestGas ? `Último dato · ${latestGas.time}` : "Sin datos"
                }
              />
            </section>

            {/* Tabs + gráficas + stats por sensor */}
            <section>
              <Tabs defaultValue="temp" className="w-full">
                <TabsList className="bg-slate-800 border border-slate-800 rounded-full p-1 gap-1">
                  <TabsTrigger
                    value="temp"
                    className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-full px-4 text-xs md:text-sm text-white"
                  >
                    Temperatura
                  </TabsTrigger>
                  <TabsTrigger
                    value="hum"
                    className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-full px-4 text-xs md:text-sm text-white"
                  >
                    Humedad
                  </TabsTrigger>
                  <TabsTrigger
                    value="pres"
                    className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-full px-4 text-xs md:text-sm text-white"
                  >
                    Presión atm
                  </TabsTrigger>
                  <TabsTrigger
                    value="luz"
                    className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-full px-4 text-xs md:text-sm text-white"
                  >
                    Luz
                  </TabsTrigger>
                  <TabsTrigger
                    value="gas"
                    className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-full px-4 text-xs md:text-sm text-white"
                  >
                    Gas
                  </TabsTrigger>
                </TabsList>

                {/* Temperatura */}
                <TabsContent value="temp" className="mt-4 space-y-3">
                  <StatsRow data={tempData} unit="°C" />
                  <Card className="bg-slate-900/70 border-slate-800 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-baseline justify-between">
                        <span className="text-sm font-medium text-slate-200">
                          Temperatura (°C)
                        </span>
                        <span className="text-2xl font-semibold text-slate-50">
                          {latestTemp
                            ? `${latestTemp.value.toFixed(1)}°`
                            : "--"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      {tempData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                          Esperando datos de temperatura en tiempo real...
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={tempData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#1f2937"
                            />
                            <XAxis
                              dataKey="time"
                              tick={{ fontSize: 11, fill: "#9ca3af" }}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: "#9ca3af" }}
                              width={40}
                            />
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
                              stroke="#22c55e"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Humedad */}
                <TabsContent value="hum" className="mt-4 space-y-3">
                  <StatsRow data={humData} unit="%" />
                  <Card className="bg-slate-900/70 border-slate-800 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-baseline justify-between">
                        <span className="text-sm font-medium text-slate-200">
                          Humedad relativa (%)
                        </span>
                        <span className="text-2xl font-semibold text-slate-50">
                          {latestHum
                            ? `${latestHum.value.toFixed(1)}%`
                            : "--"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      {humData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                          Esperando datos de humedad en tiempo real...
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={humData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#1f2937"
                            />
                            <XAxis
                              dataKey="time"
                              tick={{ fontSize: 11, fill: "#9ca3af" }}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: "#9ca3af" }}
                              width={40}
                            />
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
                              stroke="#22c55e"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Presión */}
                <TabsContent value="pres" className="mt-4 space-y-3">
                  <StatsRow data={presData} unit="hPa" />
                  <Card className="bg-slate-900/70 border-slate-800 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-baseline justify-between">
                        <span className="text-sm font-medium text-slate-200">
                          Presión (hPa)
                        </span>
                        <span className="text-2xl font-semibold text-slate-50">
                          {latestPres
                            ? `${latestPres.value.toFixed(1)} hPa`
                            : "--"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      {presData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                          Esperando datos de presión en tiempo real...
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={presData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#1f2937"
                            />
                            <XAxis
                              dataKey="time"
                              tick={{ fontSize: 11, fill: "#9ca3af" }}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: "#9ca3af" }}
                              width={40}
                            />
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
                              stroke="#22c55e"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Luz */}
                <TabsContent value="luz" className="mt-4 space-y-3">
                  <StatsRow data={luzData} unit="%" />
                  <Card className="bg-slate-900/70 border-slate-800 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-baseline justify-between">
                        <span className="text-sm font-medium text-slate-200">
                          Luz (%)
                        </span>
                        <span className="text-2xl font-semibold text-slate-50">
                          {latestLuz
                            ? `${latestLuz.value.toFixed(1)}%`
                            : "--"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      {luzData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                          Esperando datos de luz en tiempo real...
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={luzData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#1f2937"
                            />
                            <XAxis
                              dataKey="time"
                              tick={{ fontSize: 11, fill: "#9ca3af" }}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: "#9ca3af" }}
                              width={40}
                            />
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
                              stroke="#22c55e"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Gas */}
                <TabsContent value="gas" className="mt-4 space-y-3">
                  <StatsRow data={gasData} unit="%" />
                  <Card className="bg-slate-900/70 border-slate-800 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-baseline justify-between">
                        <span className="text-sm font-medium text-slate-200">
                          Gas (%)
                        </span>
                        <span className="text-2xl font-semibold text-slate-50">
                          {latestGas
                            ? `${latestGas.value.toFixed(1)}%`
                            : "--"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                      {gasData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                          Esperando datos de gas en tiempo real...
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={gasData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#1f2937"
                            />
                            <XAxis
                              dataKey="time"
                              tick={{ fontSize: 11, fill: "#9ca3af" }}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: "#9ca3af" }}
                              width={40}
                            />
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
                              stroke="#22c55e"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}