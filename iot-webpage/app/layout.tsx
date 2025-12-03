import "./globals.css"
import type { ReactNode } from "react"
import { SidebarNav } from "@/components/sidebar"

export const metadata = {
  title: "Casa inteligente Umisumi",
  description: "Dashboard IoT de sensores en tiempo real",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="min-h-screen flex">
          <SidebarNav />
          <div className="flex-1">
            <div >
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}