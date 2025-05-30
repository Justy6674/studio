import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Water4WeightLoss Design System Colors
        hydration: {
          50: "#f0f6ff",
          100: "#e0edff", 
          200: "#bad9ff",
          300: "#7bb8ff",
          400: "#5271ff", // Primary - vibrant blue-purple
          500: "#4f63d2",
          600: "#4450a0",
          700: "#3a3f82",
          800: "#33366b",
          900: "#2e3059",
        },
        brown: {
          50: "#fdf8f6",
          100: "#f2e8e4",
          200: "#e9d4ca",
          300: "#d9b5a5",
          400: "#c49982",
          500: "#b68a71", // Accent - warm brown
          600: "#a3705a",
          700: "#885c4a",
          800: "#704d3f",
          900: "#5c4136",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b", // Background - dark slate gray
          900: "#0f172a",
        },
        cream: {
          50: "#fefdfb",
          100: "#fdf9f3",
          200: "#fbf2e4",
          300: "#f7e8d1",
          400: "#f1d7b5",
          500: "#e8c094",
          600: "#daa76f",
          700: "#c88a4e",
          800: "#b5733a",
          900: "#915e32",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "wave": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(10deg)" },
          "75%": { transform: "rotate(-10deg)" },
        },
        "fill": {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "ripple": {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "bounce-water": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-25%)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "wave": "wave 2s ease-in-out infinite",
        "fill": "fill 1s ease-out",
        "shimmer": "shimmer 2s infinite",
        "ripple": "ripple 0.6s linear",
        "float": "float 3s ease-in-out infinite",
        "bounce-water": "bounce-water 1s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
