import { Link, useLocation } from "wouter";
import { Wine, Snowflake, Plus, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Navbar({ searchQuery, onSearchChange }: NavbarProps) {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1">
            <Wine className="h-6 w-6 text-primary" />
            <Snowflake className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg hidden sm:inline" data-testid="text-app-title">
              Recipe Library
            </span>
          </Link>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 w-full"
                data-testid="input-search"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setLocation("/add")}
              data-testid="button-add-recipe"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Recipe</span>
            </Button>
            
            <ThemeToggle />
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
