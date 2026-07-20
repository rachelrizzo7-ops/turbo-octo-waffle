export const theme = {
  color: {
    bg: "#0f0e17",
    surface: "#1a1826",
    surfaceAlt: "#231f36",
    border: "#332f4a",
    text: "#fffffe",
    textMuted: "#a7a6b5",
    accent: "#e4b1ab",
    accentAlt: "#7c77b9",
    danger: "#ef4565",
    success: "#4ade80",
  },
  spacing: (n: number) => n * 4,
  radius: { sm: 8, md: 14, lg: 22, pill: 999 },
  font: {
    display: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5 },
    title: { fontSize: 20, fontWeight: "700" as const },
    body: { fontSize: 15, fontWeight: "400" as const },
    label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.6 },
  },
};
