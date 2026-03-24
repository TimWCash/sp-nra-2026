"use client"

export function Ticker() {
  const text = "\u26a1 BOOTH #7365 \u00b7 North Building \u00b7 20\u00d710 Inline \u00b7 Show opens 9:30am daily \u00a0\u00a0\u00a0\u00a0\u00a0 \ud83d\udccd McCormick Place, Chicago IL \u00a0\u00a0\u00a0\u00a0\u00a0 \ud83c\udf99 Podcast setup live \u00b7 Joy of Ops neon on \u00a0\u00a0\u00a0\u00a0\u00a0 \u2705 Show closes 3pm TUESDAY \u2014 early teardown strictly prohibited"

  return (
    <div className="fixed top-14 left-0 right-0 z-[99] bg-sp-teal/10 border-b border-sp-teal/25 py-1.5 px-4 text-[11px] text-sp-teal font-medium overflow-hidden whitespace-nowrap">
      <div className="ticker-animate inline-block">
        <span>{text}</span>
        <span className="ml-16">{text}</span>
      </div>
    </div>
  )
}
