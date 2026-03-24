"use client"

import { useState, useEffect } from "react"

interface CountdownValues {
  days: number
  hours: number
  mins: number
  secs: number
  isLive: boolean
}

export function useCountdown(): CountdownValues {
  const [values, setValues] = useState<CountdownValues>({
    days: 0, hours: 0, mins: 0, secs: 0, isLive: false,
  })

  useEffect(() => {
    function calc() {
      const target = new Date("2026-05-16T09:30:00-05:00").getTime()
      const now = Date.now()
      const diff = target - now

      if (diff <= 0) {
        setValues({ days: 0, hours: 0, mins: 0, secs: 0, isLive: true })
        return
      }

      setValues({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
        isLive: false,
      })
    }

    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])

  return values
}
