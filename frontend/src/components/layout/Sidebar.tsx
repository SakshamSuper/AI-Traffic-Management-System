import Link from "next/link"
import { LayoutDashboard, Camera, TrafficCone, BarChart3, Bell, Settings, LogOut } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/cameras", label: "Live Cameras", icon: Camera },
    { href: "/signals", label: "Traffic Signals", icon: TrafficCone },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border/50 text-card-foreground shadow-sm transition-all duration-300">
      <div className="p-6 flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg">
          <TrafficCone className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">TrafficAI</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} className={cn("flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors", isActive ? "bg-indigo-500/10 text-indigo-400" : "hover:bg-muted text-muted-foreground hover:text-foreground")}> 
              <Icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center space-x-3 p-2">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold uppercase">
            {user?.username?.charAt(0) || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.username || "User"}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || "Admin"}</p>
          </div>
          <button onClick={logout} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
