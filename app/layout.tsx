import type { Metadata, Viewport } from "next"
import { Bebas_Neue, Nunito_Sans } from "next/font/google"
import "./globals.css"

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SP × NRA 2026",
  description: "Service Physics trade show hub — NRA Show 2026, Booth #7365, McCormick Place, Chicago",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SP × NRA '26",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b1a22",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${nunitoSans.variable}`}>
      <body className="min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
