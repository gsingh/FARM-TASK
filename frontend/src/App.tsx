import { Routes, Route, Navigate, NavLink } from "react-router-dom"
import TodayPage from "@/pages/today-page"
import ZonesPage from "@/pages/zones-page"
import TasksPage from "@/pages/tasks-page"
import WateringPage from "@/pages/watering-page"
import SyncIndicator from "@/components/shared/sync-indicator"
import HighContrastToggle from "@/components/shared/high-contrast-toggle"

const navItems = [
  { path: "/today", label: "Today", icon: "📋" },
  { path: "/zones", label: "Zones", icon: "🌿" },
  { path: "/tasks", label: "Tasks", icon: "✅" },
  { path: "/log", label: "Log", icon: "💧" },
]

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-farm-cream">
      <header className="flex items-center justify-end px-4 pt-2">
        <HighContrastToggle />
      </header>
      <main className="flex-1 pb-16">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/zones" element={<ZonesPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/log" element={<WateringPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="mx-auto flex max-w-lg justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 min-h-[44px] min-w-[44px] ${
                  isActive ? "text-farm-green" : "text-gray-400"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <SyncIndicator />
    </div>
  )
}
