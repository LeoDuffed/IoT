// tenemos que usar paho
// https://pypi.org/project/paho-mqtt/#installation
// ya esta codigo para conectar por mqtt
// para checar conexion: https://testclient-cloud.mqtt.cool
// sensores conectados:
// luz, temperatura, gas, lluvia


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

export default function Home() {
  const [humData, setHumData] = useState<ChartPoint[]>([])
  const [tempData, setTempData] = useState<ChartPoint[]>([])
  const [presData, setPresData] = useState<ChartPoint[]>([])
  const [luzData, setLuzData] = useState<ChartPoint[]>([])
  const [gasData, setGasData] = useState<ChartPoint[]>([])

  useEffect(() => {
    const wsUrl = API_BASE.replace("http", "ws") + "/ws"
    const ws = new WebSocket(wsUrl)

    console.log("Conectando a WebSocket:", wsUrl)

    ws.onmessage = (event) => {
      try {
        const data: WsPayload = JSON.parse(event.data)

        if (data.temperatura) {
          const p = normalizePoint(data.temperatura)
          setTempData((prev) => [...prev, p].slice(-200))
        }

        if (data.humedad) {
          const p = normalizePoint(data.humedad)
          setHumData((prev) => [...prev, p].slice(-200))
        }

        if (data.presion) {
          const p = normalizePoint(data.presion)
          setPresData((prev) => [...prev, p].slice(-200))
        }

        if (data.luz) {
          const p = normalizePoint(data.luz)
          setLuzData((prev) => [...prev, p].slice(-200))
        }

        if (data.gas) {
          const p = normalizePoint(data.gas)
          setGasData((prev) => [...prev, p].slice(-200))
        }
      } catch (err) {
        console.error("Error parseando mensaje de WS:", err)
      }
    }

    ws.onerror = (err) => {
      console.error("WebSocket error:", err)
    }

    ws.onclose = () => {
      console.log("WebSocket cerrado")
    }

    return () => {
      ws.close()
    }
  }, [])

  return (
    <main className="min-h-screen bg-sky-50 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Encabezado */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sensores en la casa inteligente
          </h1>
          <p className="text-sm text-slate-600">
            Gráficas en tiempo real desde los sensores conectados al Arduino.
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
              value="pres"
              className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-900 rounded-full px-4"
            >
              Presión atm
            </TabsTrigger>
            <TabsTrigger
              value="luz"
              className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-900 rounded-full px-4"
            >
              Luz
            </TabsTrigger>
            <TabsTrigger
              value="gas"
              className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-900 rounded-full px-4"
            >
              Gas
            </TabsTrigger>
          </TabsList>

          {/* Temperatura */}
          <TabsContent value="temp" className="mt-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    Temperatura (°C)
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">
                    {tempData.length > 0
                      ? `${tempData[tempData.length - 1].value.toFixed(1)}°`
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
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

          {/* Humedad */}
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
                {humData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    Esperando datos de humedad en tiempo real...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={humData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
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

          {/* Presión */}
          <TabsContent value="pres" className="mt-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    Presión (hPa)
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">
                    {presData.length > 0
                      ? `${presData[presData.length - 1].value.toFixed(1)} hPa`
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
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

          {/* Luz */}
          <TabsContent value="luz" className="mt-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    Luz (%)
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">
                    {luzData.length > 0
                      ? `${luzData[luzData.length - 1].value.toFixed(1)}%`
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
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

          {/* Gas */}
          <TabsContent value="gas" className="mt-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    Gas (%)
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">
                    {gasData.length > 0
                      ? `${gasData[gasData.length - 1].value.toFixed(1)}%`
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
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
        </Tabs>
      </div>
    </main>
  )
}