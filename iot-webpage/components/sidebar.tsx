"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

type NavItem = {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Gráficas", href: "/graficas" },
  //{ label: "Alertas", href: "/alertas" }, No me gusta como esta quedando
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-slate-600 bg-slate-700 backdrop-blur">
      {/* Header del sidebar */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl bg-pink-500 flex items-center justify-center text-lg">
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

      {/* links */}
      <nav className="flex-1 px-3 pt-7 space-y-1 text text-white">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block px-3 py-2 rounded-xl transition-colors",
                active
                  ? "bg-slate-900 text-slate-50 font-medium"
                  : "hover:bg-slate-900/60",
              ].join(" ")}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 text-xs text-slate-500">
        <p>Hecho por Duffed</p>
      </div>
    </aside>
  )
}