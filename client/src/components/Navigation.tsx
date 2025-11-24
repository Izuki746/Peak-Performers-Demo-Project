import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "./ThemeToggle";
import { Zap, LayoutDashboard, Antenna, MessageSquare } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/feeders", label: "Feeders", icon: Antenna },
    { path: "/ai-assistant", label: "AI Assistant", icon: MessageSquare }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/">
            <a className="flex items-center gap-3 hover-elevate rounded-md px-3 py-2 -ml-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Grid Command Center</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Beckn Protocol DER Orchestration</p>
              </div>
            </a>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <a>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                      data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2 hidden sm:flex">
            <div className="h-2 w-2 rounded-full bg-accent-foreground animate-pulse" />
            Live
          </Badge>
          <ThemeToggle />
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="flex md:hidden items-center gap-2 px-6 pb-3 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <a>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </a>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
