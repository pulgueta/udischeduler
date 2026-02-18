const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        container: "16px",
      },
      boxShadow: {
        DEFAULT: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        subtle: "0 1px 2px rgba(0, 0, 0, 0.04)",
        card: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)",
      },
      colors: {
        primary: {
          DEFAULT: "#18181B",
          hover: "#27272A",
          light: "#3F3F46",
        },
        secondary: {
          DEFAULT: "#71717A",
          hover: "#52525B",
          light: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#64748B",
          hover: "#475569",
          light: "#94A3B8",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#FAFAFA",
          tertiary: "#F4F4F5",
        },
        border: {
          DEFAULT: "#E4E4E7",
          light: "#F4F4F5",
          dark: "#D4D4D8",
        },
      },
      spacing: {
        "form-field": "14px",
        section: "40px",
        "section-sm": "24px",
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active"],
    },
  },
};
