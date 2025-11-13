"use client"

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

// Datos dummy para las gráficas
const tempData = [
  { time: "10:00", value: 22.1 },
  { time: "10:10", value: 22.4 },
  { time: "10:20", value: 22.8 },
  { time: "10:30", value: 23.0 },
  { time: "10:40", value: 23.3 },
  { time: "10:50", value: 23.1 },
]

const humData = [
  { time: "10:00", value: 48 },
  { time: "10:10", value: 50 },
  { time: "10:20", value: 49 },
  { time: "10:30", value: 51 },
  { time: "10:40", value: 50 },
  { time: "10:50", value: 52 },
]

const gasData = [
  { time: "10:00", value: 120 },
  { time: "10:10", value: 130 },
  { time: "10:20", value: 110 },
  { time: "10:30", value: 140 },
  { time: "10:40", value: 135 },
  { time: "10:50", value: 125 },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-sky-50 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Encabezado muy simple */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Casa Inteligente
          </h1>
          <p className="text-sm text-slate-600">
            Vista de gráficas de sensores (datos de ejemplo).
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

          {/* Temperatura */}
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
                    <YAxis
                      tick={{ fontSize: 12 }}
                      width={40}
                      domain={["auto", "auto"]}
                    />
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

          {/* Humedad */}
          <TabsContent value="hum" className="mt-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    Humedad relativa (%)
                  </span>
                  <span className="text-2xl font-semibold text-slate-900">
                    50%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={humData}>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gas */}
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
