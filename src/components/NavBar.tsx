import React, { useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";
import { Button } from "@/components/ui/button";
import { supabaseClient as supabase } from "@/db/supabase.client";

interface NavBarProps {
  userEmail?: string;
  className?: string;
}

/**
 * Navigation bar component with user menu and logout functionality.
 * Shows different navigation options based on authentication state.
 */
export function NavBar({ userEmail: initialUserEmail, className }: NavBarProps) {
  const [userEmail, setUserEmail] = useState<string | undefined>(initialUserEmail);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check auth state on mount and when it changes
  // Use getUser() to verify the session is authentic
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        const {
          data: { user },
        } = await supabase.auth.getUser(session.access_token);
        setUserEmail(user?.email);
      } else {
        setUserEmail(undefined);
      }
    };

    checkSession();

    // Listen for auth changes - onAuthStateChange provides verified session data
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        const {
          data: { user },
        } = await supabase.auth.getUser(session.access_token);
        setUserEmail(user?.email);
      } else {
        setUserEmail(undefined);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error);
      }

      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <nav className={`w-full border-b bg-background shadow-sm ${className || ""}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <a
            href="/app/dashboard"
            className="text-xl font-bold text-foreground hover:opacity-80 transition-opacity"
            aria-label="Diet Planner Home"
          >
            Diet Planner
          </a>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {userEmail ? (
              <>
                <span
                  className="hidden sm:inline-block text-sm text-muted-foreground truncate max-w-[200px]"
                  aria-label="Logged in as"
                  title={userEmail}
                >
                  {userEmail}
                </span>
                <Button variant="ghost" onClick={handleLogout} disabled={isLoggingOut} aria-label="Log out" size="sm">
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </Button>
              </>
            ) : (
              <a href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
