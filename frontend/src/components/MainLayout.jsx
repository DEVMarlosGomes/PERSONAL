import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Dumbbell,
  Users,
  LayoutDashboard,
  TrendingUp,
  Bell,
  LogOut,
  Menu,
  User,
  ChevronRight,
  Upload,
  MessageCircle,
  Sun,
  Moon,
  Trophy
} from "lucide-react";

const personalLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/treinos", label: "Treinos", icon: Upload },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/conquistas", label: "Ranking", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

const studentLinks = [
  { href: "/treino", label: "Meu Treino", icon: Dumbbell },
  { href: "/meu-progresso", label: "Evolução", icon: TrendingUp },
  { href: "/conquistas", label: "Conquistas", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

export const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = user?.role === "personal" ? personalLinks : studentLinks;

  const NavLinks = ({ mobile = false }) => (
    <nav className={`flex ${mobile ? "flex-col" : "items-center gap-1"}`}>
      {links.map((link) => {
        const isActive = location.pathname === link.href;
        return (
          <Link
            key={link.href}
            to={link.href}
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-primary text-white font-semibold"
                : "text-muted-foreground hover:text-white hover:bg-secondary/50"
            } ${mobile ? "w-full" : ""}`}
            data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
            {mobile && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={user?.role === "personal" ? "/dashboard" : "/treino"} className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase gradient-text hidden sm:block">
                FitMaster
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <NavLinks />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                data-testid="theme-toggle-btn"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              {/* Notifications */}
              <Link to="/notificacoes">
                <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                  <Bell className="w-5 h-5" />
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hidden sm:flex" data-testid="user-menu-btn">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <div className="px-3 py-2">
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-primary capitalize mt-1">{user?.role === "personal" ? "Personal Trainer" : "Aluno"}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-btn">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-card border-border p-0">
                  <ScrollArea className="h-full">
                    <div className="p-6">
                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.role === "personal" ? "Personal Trainer" : "Aluno"}</p>
                        </div>
                      </div>

                      {/* Nav Links */}
                      <NavLinks mobile />

                      {/* Notifications */}
                      <Link
                        to="/notificacoes"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 mt-2 rounded-lg text-muted-foreground hover:text-white hover:bg-secondary/50 transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                        Notificações
                      </Link>

                      {/* Logout */}
                      <button
                        onClick={() => { logout(); setMobileMenuOpen(false); }}
                        className="flex items-center gap-2 px-4 py-2 mt-6 w-full rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
