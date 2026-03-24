"use client"

import { useState, useEffect } from "react"

export function useChicagoTime(): string {
  const [time, setTime] = useState("")

  useEffect(() => {
    function update() {
      const t = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Chicago",
      })
      setTime(t + " CT")
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return time
}
