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
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts"

// Datos dummy para temperatura y gas
const tempData = [
  { time: "10:00", value: 22.1 },
  { time: "10:10", value: 22.4 },
  { time: "10:20", value: 22.8 },
  { time: "10:30", value: 23.0 },
  { time: "10:40", value: 23.3 },
  { time: "10:50", value: 23.1 },
]

const gasData = [
  { time: "10:00", value: 120 },
  { time: "10:10", value: 130 },
  { time: "10:20", value: 110 },
  { time: "10:30", value: 140 },
  { time: "10:40", value: 135 },
  { time: "10:50", value: 125 },
]

// Tipo de dato que regresa el backend de Python
type HumApiPoint = {
  value: number
  time: string
}

type HumPoint = {
  value: number
  time: string
  isoTime: string
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"

export default function Home() {
  const [humData, setHumData] = useState<HumPoint[]>([])
  const [loadingHum, setLoadingHum] = useState(false)
  const [errorHum, setErrorHum] = useState<string | null>(null)

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
        const data: HumApiPoint[] = await res.json()
        const normalized = data
          .map((point) => {
            const isoTime = point.time.includes("T")
              ? point.time
              : point.time.replace(" ", "T")
            const dateValue = new Date(isoTime)

            return {
              value: point.value,
              isoTime,
              time: dateValue.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
            }
          })
          .sort(
            (a, b) =>
              new Date(a.isoTime).getTime() - new Date(b.isoTime).getTime(),
          )
        setHumData(normalized)
      } catch (err) {
        console.error(err)
        setErrorHum("No se pudieron cargar los datos de humedad.")
      } finally {
        setLoadingHum(false)
      }
    }

    fetchHum()
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
                    23.1°
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tempData}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={40} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0ea5e9"
                      fill="url(#tempGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
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

          {/* Gas (dummy) */}
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
        </Tabs>
      </div>
    </main>
  )
}
