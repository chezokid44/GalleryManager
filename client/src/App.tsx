import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Images, Settings, Home as HomeIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Galleries", icon: HomeIcon },
    { path: "/admin", label: "Admin", icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Images className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold">PhotoGallery Pro</h1>
            </Link>
            
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile navigation */}
          <nav className="flex md:hidden gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="w-8 h-8 p-0"
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
