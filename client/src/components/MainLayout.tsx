import { Link, useLocation } from "wouter";
import { Copy, LayoutDashboard, Map, User, Menu } from "lucide-react"; // Using Copy as placeholder for Anamnese if ClipboardList not avail.
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Sidebar Items
const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Minha Trilha", icon: Map, href: "/track" }, // Assuming route, might need adjustment
  { label: "Anamnese", icon: Copy, href: "/assessment" },
  { label: "Perfil", icon: User, href: "/profile" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-[#FCFAF8] text-[#202020]">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#FCFAF8] z-50">
        <div className="p-8">
            {/* Logo area */}
            <h1 className="text-[26px] leading-[35px] font-bold text-[#202020]">
                MetaTask
            </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] leading-[18px] font-normal transition-all duration-200 ease-out group focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2]",
                  isActive 
                    ? "bg-white shadow-sm text-[#202020]" 
                    : "text-[#808080] hover:bg-gray-100/50 hover:text-[#202020]"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors duration-200 ease-out",
                    isActive ? "text-[#202020]" : "text-[#808080] group-hover:text-[#202020]"
                  )} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
           {/* User mini profile could go here */}
           <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100/50 rounded-lg cursor-pointer transition-colors duration-200 ease-out">
               <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[#202020] font-bold text-[13px]">
                   U
               </div>
               <div className="flex-1 min-w-0">
                   <p className="text-[13px] leading-[18px] font-bold text-[#202020] truncate">Usuário</p>
                   <p className="text-[12px] text-[#808080] truncate">Sair</p>
               </div>
           </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <main className="flex-1 lg:ml-64 w-full min-h-screen transition-all duration-300 ease-in-out relative">
        <div className="p-6 pb-24 lg:pb-6 lg:p-10 max-w-7xl mx-auto">
            {children}
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50 pb-safe">
        <div className="flex items-center justify-around">
            {NAV_ITEMS.map((item) => {
                 const isActive = location === item.href;
                 return (
                    <Link key={item.href} href={item.href}>
                        <a className="flex flex-col items-center gap-1 group focus:outline-none focus:ring-4 focus:ring-[#dceaff] rounded-lg">
                            <div className={cn(
                                "p-2 rounded-lg transition-all duration-200 ease-out",
                                isActive ? "bg-gray-100 text-[#202020]" : "text-[#808080] group-hover:text-[#202020]"
                            )}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            {/* Optional Label for Mobile? Usually cleaner without if icons are clear, or very small text */}
                            {/* <span className="text-[10px] font-medium">{item.label}</span> */}
                        </a>
                    </Link>
                 )
            })}
        </div>
      </div>
    </div>
  );
}
