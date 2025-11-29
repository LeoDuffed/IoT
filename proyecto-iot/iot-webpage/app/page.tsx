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
import { EstadisticasWidget } from "@/components/estadisticas-widget"
import { ResumenWidget } from "@/components/resumen-widget"

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

// Helpers de frontend para stats / últimos valores
const getLatest = (data: ChartPoint[]) =>
  data.length > 0 ? data[data.length - 1] : null

async function fetchHistory(
  path: string,
  setter: (data: ChartPoint[]) => void,
) {
  try {
    const res = await fetch(`${API_BASE}${path}`)
    const json: ApiPoint[] = await res.json()
    const normalized = json.map(normalizePoint)
    setter(normalized.slice(-MAX_POINTS))
  } catch (err) {
    console.error("Error haciendo fetch de", path, err)
  }
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
    // Reloj simple
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchHistory("/temperatura?limit=200", setTempData)
    fetchHistory("/humedad?limit=200", setHumData)
    fetchHistory("/presion?limit=200", setPresData)
    fetchHistory("/luz?limit=200", setLuzData)
    fetchHistory("/gas?limit=200", setGasData)
  }, [])

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
        {/* Contenido principal */}
        <div className="flex-1">
          <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
            {/* Hero */}
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

            {/* Resumen */}
            <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <ResumenWidget
                label="Temperatura"
                value={
                  latestTemp ? `${latestTemp.value.toFixed(1)} °C` : "-- °C"
                }
                subtitle={
                  latestTemp ? `Último dato · ${latestTemp.time}` : "Sin datos"
                }
              />
              <ResumenWidget
                label="Humedad"
                value={
                  latestHum ? `${latestHum.value.toFixed(1)} %` : "-- %"
                }
                subtitle={
                  latestHum ? `Último dato · ${latestHum.time}` : "Sin datos"
                }
              />
              <ResumenWidget
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
              <ResumenWidget
                label="Luz"
                value={
                  latestLuz ? `${latestLuz.value.toFixed(1)} %` : "-- %"
                }
                subtitle={
                  latestLuz ? `Último dato · ${latestLuz.time}` : "Sin datos"
                }
              />
              <ResumenWidget
                label="Gas"
                value={
                  latestGas ? `${latestGas.value.toFixed(1)} %` : "-- %"
                }
                subtitle={
                  latestGas ? `Último dato · ${latestGas.time}` : "Sin datos"
                }
              />
            </section>

            {/* Tabs + gráficas */}
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
                  <EstadisticasWidget data={tempData} unit="°C" />
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
                  <EstadisticasWidget data={humData} unit="%" />
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
                  <EstadisticasWidget data={presData} unit="hPa" />
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
                  <EstadisticasWidget data={luzData} unit="%" />
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
                  <EstadisticasWidget data={gasData} unit="%" />
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