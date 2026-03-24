"use client"

import { useState, useEffect, useCallback } from "react"

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const saved = localStorage.getItem("sp-theme") as "dark" | "light" | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute("data-theme", saved)
    }
  }, [])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      localStorage.setItem("sp-theme", next)
      document.documentElement.setAttribute("data-theme", next)
      return next
    })
  }, [])

  return { theme, toggle }
}
