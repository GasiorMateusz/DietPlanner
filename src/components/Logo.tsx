import React from "react";
import { useTheme } from "@/lib/theme/useTheme";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo component that displays different strawberry logos based on the current theme.
 * - Light theme: wes_anderson_strawberry.png
 * - Dark theme: synth_strawberry.png
 */
export function Logo({ className = "", size = 40 }: LogoProps) {
  const { theme } = useTheme();

  // Determine which logo to use based on theme
  // Default to light theme logo if theme is not available (SSR/hydration)
  const logoSrc = theme === "dark" ? "/synth_strawberry.png" : "/wes_anderson_strawberry.png";

  return (
    <img
      src={logoSrc}
      alt="Diet Planner Logo"
      className={className}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
