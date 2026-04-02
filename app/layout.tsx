import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"

export const metadata: Metadata = {
  title: "SP @ NRA 2026",
  description: "Service Physics trade show hub — NRA Show 2026, Booth #7365, McCormick Place, Chicago",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SP @ NRA",
  },
  other: {
    "apple-touch-icon": "/apple-touch-icon.svg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#008493",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
