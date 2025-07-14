import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { 
  Home, 
  BarChart3, 
  Settings, 
  CreditCard, 
  PieChart, 
  BellRing, 
  User, 
  Repeat, 
  Moon, 
  Sun, 
  TrendingUp, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Wallet,
  Target,
  Sparkles
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSidebar, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getCurrencySymbol } from "@/utils/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Theme toggle component avec design moderne
const ModeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 hover:scale-105 hover:shadow-md"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

// Configuration des liens avec icônes modernisées
const sidebarLinks = [
  {
    title: "Tableau de bord",
    icon: Home,
    href: "/",
    active: (pathname: string) => pathname === "/",
    category: "navigation"
  },
  {
    title: "Transactions",
    icon: CreditCard,
    href: "/transactions",
    active: (pathname: string) => pathname === "/transactions",
    category: "navigation"
  },
  {
    title: "Catégories",
    icon: PieChart,
    href: "/categories",
    active: (pathname: string) => pathname.startsWith("/categories"),
    category: "navigation"
  },
  {
    title: "Statistiques",
    icon: BarChart3,
    href: "/statistics",
    active: (pathname: string) => pathname === "/statistics",
    category: "navigation"
  },
  {
    title: "Alertes",
    icon: BellRing,
    href: "/alerts",
    active: (pathname: string) => pathname === "/alerts",
    category: "navigation"
  },
  {
    title: "Finance Intelligente",
    icon: Sparkles,
    href: "/smart-finance",
    active: (pathname: string) => pathname === "/smart-finance",
    category: "smart"
  },
  {
    title: "Abonnements",
    icon: Repeat,
    href: "/recurring-payments",
    active: (pathname: string) => pathname === "/recurring-payments",
    category: "smart"
  },
  {
    title: "Paramètres",
    icon: Settings,
    href: "/settings",
    active: (pathname: string) => pathname === "/settings",
    category: "settings"
  },
  {
    title: "Profil",
    icon: User,
    href: "/profile",
    active: (pathname: string) => pathname === "/profile",
    category: "settings"
  },
];

// Composant pour un lien de navigation avec effets modernes
const NavLink = ({ link, pathname, isCollapsed = false }: { 
  link: any; 
  pathname: string; 
  isCollapsed?: boolean;
}) => {
  const isActive = link.active(pathname);
  
  return (
    <Link 
      to={link.href} 
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300",
        "hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-blue-900/20",
        "hover:shadow-sm hover:-translate-y-0.5",
        isActive && [
          "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20",
          "border-l-4 border-l-blue-500",
          "shadow-md shadow-blue-500/20",
          "text-blue-700 dark:text-blue-300",
          "font-medium"
        ],
        !isActive && "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
      )}
    >
      {/* Indicateur de section active */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full shadow-lg" />
      )}
      
      {/* Icône avec effet de glow */}
      <div className={cn(
        "relative flex items-center justify-center w-5 h-5 transition-all duration-300",
        isActive && "text-blue-600 dark:text-blue-400",
        !isActive && "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
      )}>
        <link.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
        {isActive && (
          <motion.div
            layoutId="sidebar-active-bg"
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 z-0"
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          />
        )}
      </div>
      
      {/* Texte */}
      {!isCollapsed && (
        <span className="text-sm font-medium transition-all duration-300">
          {link.title}
        </span>
      )}
      
      {/* Effet de surbrillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
    </Link>
  );
};

export function AppSidebar({ className }: { className?: string }) {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currency, setCurrency, availableCurrencies, formatCurrency } = useCurrency();
  const { isMobile } = useSidebar();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Récupérer les initiales du nom de l'utilisateur
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Grouper les liens par catégorie
  const navigationLinks = sidebarLinks.filter(link => link.category === "navigation");
  const smartLinks = sidebarLinks.filter(link => link.category === "smart");
  const settingsLinks = sidebarLinks.filter(link => link.category === "settings");

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-72 flex flex-col gap-0 p-0 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            {/* Header mobile */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                  <Sparkles className="h-4 w-4" />
                </div>
                <SheetTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  BudgetFlow
                </SheetTitle>
              </div>
              <SheetDescription className="text-slate-600 dark:text-slate-400">
                Gérez vos finances personnelles intelligemment
              </SheetDescription>
            </div>

            {/* User info mobile */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold">
                  {user?.name ? getUserInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                {user?.name || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email || 'utilisateur@example.com'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation mobile */}
            <ScrollArea className="flex-1 px-3 py-4">
              <div className="space-y-6">
                {/* Navigation principale */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                    Navigation
                  </h3>
                  <div className="space-y-1">
                    {navigationLinks.map((link) => (
                      <NavLink key={link.href} link={link} pathname={pathname} />
                    ))}
                  </div>
                </div>

                {/* Finance intelligente */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                    Finance Intelligente
                  </h3>
                  <div className="space-y-1">
                    {smartLinks.map((link) => (
                      <NavLink key={link.href} link={link} pathname={pathname} />
                    ))}
                  </div>
                </div>

                {/* Paramètres */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                    Paramètres
                  </h3>
                  <div className="space-y-1">
                    {settingsLinks.map((link) => (
                      <NavLink key={link.href} link={link} pathname={pathname} />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer mobile */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-3">
              <ModeToggle />
                <div className="flex-1">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCurrencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {getCurrencySymbol(curr.code)} {curr.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full h-10 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <Sidebar className={cn("border-r border-slate-200 dark:border-slate-700 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800", className)}>
        <SidebarHeader className="p-4 border-b border-slate-200 dark:border-slate-700">
          {/* Logo et titre */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              <Sparkles className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              BudgetFlow
            </span>
            )}
          </div>

          {/* User info */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 border border-slate-200 dark:border-slate-700",
            isCollapsed && "justify-center"
          )}>
            <Avatar className="h-8 w-8 border-2 border-slate-200 dark:border-slate-700 shadow-sm">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-semibold">
                {user?.name ? getUserInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
              {user?.name || 'Utilisateur'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'utilisateur@example.com'}
                </p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <ScrollArea className="h-full">
            <div className="space-y-6">
              {/* Navigation principale */}
              <div>
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                    Navigation
                  </h3>
                )}
                <div className="space-y-1">
                  {navigationLinks.map((link) => (
                    <NavLink key={link.href} link={link} pathname={pathname} isCollapsed={isCollapsed} />
                  ))}
                </div>
              </div>

              {/* Finance intelligente */}
              <div>
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                    Finance Intelligente
                  </h3>
                )}
                <div className="space-y-1">
                  {smartLinks.map((link) => (
                    <NavLink key={link.href} link={link} pathname={pathname} isCollapsed={isCollapsed} />
                  ))}
                </div>
              </div>

              {/* Paramètres */}
              <div>
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                    Paramètres
                  </h3>
                )}
                <div className="space-y-1">
                  {settingsLinks.map((link) => (
                    <NavLink key={link.href} link={link} pathname={pathname} isCollapsed={isCollapsed} />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-3">
            {/* Contrôles */}
            <div className={cn(
              "flex items-center gap-2",
              isCollapsed && "justify-center"
            )}>
              <ModeToggle />
              {!isCollapsed && (
                <div className="flex-1">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCurrencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {getCurrencySymbol(curr.code)} {curr.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Bouton de déconnexion */}
              <Button 
                variant="outline" 
                onClick={handleLogout}
              className={cn(
                "w-full h-10 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200",
                isCollapsed && "w-10 h-10 p-0"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Déconnexion</span>}
            </Button>

            {/* Bouton collapse/expand */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
