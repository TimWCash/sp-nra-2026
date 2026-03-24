"use client"

import { openers, coreMessages, objections } from "@/lib/data"
import type { TalkingPoint } from "@/lib/data"

function TalkCard({ point }: { point: TalkingPoint }) {
  return (
    <div className="bg-sp-surface border-l-[3px] border-l-sp-teal rounded-r-sp p-3.5 px-4 mb-2.5">
      <div className="font-display text-[13px] text-sp-teal tracking-wider mb-1">{point.tag}</div>
      <div className="text-sm leading-relaxed">{point.text}</div>
    </div>
  )
}

export function TalkingPage() {
  return (
    <div className="animate-fade-in">
      <div className="font-display text-[28px] tracking-wider text-sp-text mb-4">At the Booth</div>

      <div className="bg-sp-teal/10 border border-sp-teal/20 rounded-[10px] p-2.5 px-3.5 text-[13px] mb-4">
        Use these to open conversations. Keep it natural \u2014 you know this stuff. \ud83c\udfaf
      </div>

      <div className="font-display text-lg tracking-wider text-sp-text mb-2.5">Opening Lines</div>
      {openers.map((p, i) => <TalkCard key={i} point={p} />)}

      <div className="font-display text-lg tracking-wider text-sp-text mt-5 mb-2.5">Core Message</div>
      {coreMessages.map((p, i) => <TalkCard key={i} point={p} />)}

      <div className="font-display text-lg tracking-wider text-sp-text mt-5 mb-2.5">Objection Handling</div>
      {objections.map((p, i) => <TalkCard key={i} point={p} />)}

      <div className="font-display text-lg tracking-wider text-sp-text mt-5 mb-2.5">Closing the Conversation</div>
      <TalkCard point={{ tag: "NEXT STEP", text: "Always end with a clear action: send a case study, book a follow-up call, or invite them to be a podcast guest. Scan their badge with lead retrieval and add a note immediately." }} />

      <div className="font-display text-lg tracking-wider text-sp-text mt-5 mb-2.5">Mr. Potato Head \ud83e\udd54</div>
      <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
        <p className="text-sm leading-relaxed">
          Hide him somewhere different each day \u2014 creates a fun reason to come back. Or hide individual parts (glasses, mustache, hat) around the booth as a scavenger hunt. First to find all pieces wins a Joy of Ops mug. \ud83c\udfc6
        </p>
      </div>
    </div>
  )
}
