import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Trophy, Home, BarChart3, Settings, LogOut, Menu, X, User } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";

interface HeaderProps {
  /**
   * Whether to show the header (useful for public pages)
   * @default true
   */
  showHeader?: boolean;
}

export default function Header({ showHeader = true }: HeaderProps) {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Navigation items - conditionally shown based on auth and role
  const navItems = useMemo(() => {
    const items: Array<{ path: string; label: string; icon: typeof Home; requiresAuth?: boolean; requiresAdmin?: boolean }> = [];

    // Dashboard - only for authenticated users
    if (user) {
      items.push({ path: "/dashboard", label: "მთავარი", icon: Home, requiresAuth: true });
    }

    // Leaderboard - always visible
    items.push({ path: "/leaderboard", label: "რეიტინგი", icon: BarChart3 });

    items.push({ path: "/grand-tournament", label: "გრანდ ტურნირი", icon: Trophy });

    // Profile - only for authenticated users
    if (user) {
      items.push({ path: "/profile", label: "პროფილი", icon: User, requiresAuth: true });
    }

    // Admin - only for admins
    if (isAdmin) {
      items.push({ path: "/admin", label: "ადმინი", icon: Settings, requiresAuth: true, requiresAdmin: true });
    }

    return items;
  }, [isAdmin, user]);

  const isActive = (path: string) => location.pathname === path;

  if (!showHeader) {
    return null;
  }

  return (
    <header ref={mobileMenuRef} className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo/Name */}
          <Link 
            to="/" 
            className="flex items-center gap-3 flex-shrink-0"
            onClick={(e) => {
              if (location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <img 
              src="/images/logo.png" 
              alt="LastFanStanding Logo" 
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Center: Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right: User section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 hidden sm:flex"
              >
                <LogOut className="w-4 h-4" />
                გასვლა
              </Button>
            ) : (
              <Link to="/auth">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 hidden sm:flex"
                >
                  შესვლა
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="w-5 h-5 transition-transform duration-300" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div
          className={`md:hidden border-t border-border/50 bg-card overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? 'max-h-96 opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            {user && (
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                გასვლა
              </Button>
            )}
            {!user && (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="default"
                  className="w-full justify-start gap-2"
                >
                  შესვლა
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
