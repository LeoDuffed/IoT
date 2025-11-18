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
  value: number
  time: string
}

type ChartPoint = {
  value: number
  time: string
  isoTime: string
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"

const getTimestamp = (isoTime: string) => {
  const ts = new Date(isoTime).getTime()
  return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts
}

const normalizeSeries = (data: ApiPoint[]): ChartPoint[] =>
  data
    .map((point) => {
      const rawTime = point.time ?? ""
      const isoTime =
        rawTime && rawTime.includes("T")
          ? rawTime
          : rawTime.replace(" ", "T")
      const dateValue = rawTime ? new Date(isoTime) : null

      return {
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
    })
    .sort((a, b) => getTimestamp(a.isoTime) - getTimestamp(b.isoTime))

export default function Home() {
  const [humData, setHumData] = useState<ChartPoint[]>([])
  const [tempData, setTempData] = useState<ChartPoint[]>([])
  const [loadingHum, setLoadingHum] = useState(false)
  const [loadingTemp, setLoadingTemp] = useState(false)
  const [errorHum, setErrorHum] = useState<string | null>(null)
  const [errorTemp, setErrorTemp] = useState<string | null>(null)

  useEffect(() => {
    const fetchHum = async () => {
      try {
        setLoadingHum(true)
        setErrorHum(null)
        const res = await fetch(`${API_BASE}/humedad`, {
          cache: "no-store",
        })
        if (!res.ok) {
          throw new Error("Respuesta no OK del servidor")
        }
        const data: ApiPoint[] = await res.json()
        setHumData(normalizeSeries(data))
      } catch (err) {
        console.error(err)
        setErrorHum("No se pudieron cargar los datos de humedad.")
      } finally {
        setLoadingHum(false)
      }
    }

    fetchHum()
  }, [])

  useEffect(() => {
    const fetchTemp = async () => {
      try {
        setLoadingTemp(true)
        setErrorTemp(null)
        const res = await fetch(`${API_BASE}/temperatura`, {
          cache: "no-store",
        })
        if (!res.ok) {
          throw new Error("Respuesta no OK del servidor")
        }
        const data: ApiPoint[] = await res.json()
        setTempData(normalizeSeries(data))
      } catch (err) {
        console.error(err)
        setErrorTemp("No se pudieron cargar los datos de temperatura.")
      } finally {
        setLoadingTemp(false)
      }
    }

    fetchTemp()
  }, [])

  return (
    <main className="min-h-screen bg-sky-50 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Encabezado muy simple */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Casa Inteligente
          </h1>
          <p className="text-sm text-slate-600">
            Vista de gráficas de sensores.
          </p>
        </header>

        <Separator />

        {/* Tabs para cambiar de sensor */}
        <Tabs defaultValue="temp" className="w-full">
          <TabsList className="bg-white border border-slate-200 rounded-full p-1 gap-1">
            <TabsTrigger
              value="temp"
              className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-900 rounded-full px-4"
            >
              Temperatura
            </TabsTrigger>
            <TabsTrigger
              value="hum"
              className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-900 rounded-full px-4"
            >
              Humedad
            </TabsTrigger>
            <TabsTrigger
              value="gas"
              className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-900 rounded-full px-4"
            >
              Gas
            </TabsTrigger>
          </TabsList>

          {/* Temperatura (dummy) */}
          <TabsContent value="temp" className="mt-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    Temperatura (°C)
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">
                    {tempData.length > 0
                      ? `${tempData[tempData.length - 1].value.toFixed(1)}°` : "--"
                    }
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {loadingTemp ? (
                  <div className="h-full flex items-center justify-center text-sm text-black">
                    Cargando datos de temperatura...
                  </div>
                ) : errorTemp ? (
                  <div className="h-full flex items-center justify-center text-sm text-red-500">
                    {errorTemp}
                  </div>
                ) : tempData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-black">
                    No hay datos de temperatura.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} width={40} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          fontSize: 12,
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

          {/* Humedad (conectada a Python + MySQL) */}
          <TabsContent value="hum" className="mt-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    Humedad relativa (%)
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">
                    {humData.length > 0
                      ? `${humData[humData.length - 1].value.toFixed(1)}%`
                      : "--"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {loadingHum ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    Cargando datos de humedad...
                  </div>
                ) : errorHum ? (
                  <div className="h-full flex items-center justify-center text-sm text-red-500">
                    {errorHum}
                  </div>
                ) : humData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    No hay datos de humedad en la base de datos.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={humData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} width={40} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          fontSize: 12,
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

          {/* Gas (dummy)
          <TabsContent value="gas" className="mt-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    Concentración de gas (ppm)
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">
                    130 ppm
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gasData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={50} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          */}
        </Tabs>
      </div>
    </main>
  )
}
