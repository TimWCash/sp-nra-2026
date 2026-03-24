import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SP @ NRA 2026",
  description: "Service Physics trade show hub — NRA Show 2026, Booth #7365, McCormick Place, Chicago",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SP @ NRA",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f9fb",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
