// ── SCHEDULE ──
export interface ScheduleEvent {
  time: string
  title: string
  sub?: string
  highlight?: "open" | "close" | "close-final"
  link?: { url: string; label: string }
}

export const schedule: Record<string, ScheduleEvent[]> = {
  fri: [
    { time: "Morning", title: "Team arrives in Chicago", sub: "Check in to Airbnb · Settle in" },
    { time: "11am–4pm", title: "Exhibitor Move-In Window", sub: "North Building · Booths 5500–9200 · Booth #7365", highlight: "open" },
    { time: "4:00pm", title: "Booth setup must be complete", sub: "Display installation deadline — no exceptions", highlight: "close" },
    { time: "4:00pm", title: "Prosper Accelerator Welcome Mixer", sub: "Middleby Showroom · 222 W Merchandise Mart Plaza · Free networking with foodservice leaders", link: { url: "https://www.eventbrite.com/e/prosper-accelerator-welcome-mixer-tickets-1936131705049", label: "Register on Eventbrite" } },
    { time: "6:00pm", title: "Mixer ends", sub: "Team dinner · Final prep for tomorrow" },
  ],
  sat: [
    { time: "9:00am", title: "Pre-Show Team Meeting", sub: "Review goals, booth assignments, talking points" },
    { time: "9:30am", title: "SHOW FLOOR OPENS", sub: "All hands on deck at Booth #7365", highlight: "open" },
    { time: "10:00am", title: "Podcast sessions begin", sub: "Nomono setup live \u00b7 On Air sign on" },
    { time: "12:00pm", title: "Submit Press Kit", sub: "Room S101b \u2014 bring physical copy or zip drive" },
    { time: "3:00–6:00pm", title: "🍸 Perlick Happy Hour at NRA", sub: "Glessner House · 1800 S Prairie Ave · Cocktails + light bites · Live music · Walking distance from McCormick", link: { url: "https://www.eventbrite.com/e/perlick-happy-hour-at-nra-tickets-1987447258250", label: "RSVP on Eventbrite" } },
    { time: "5:00pm", title: "Show Floor Closes", highlight: "close" },
    { time: "Evening", title: "Daily Debrief", sub: "Adjust for tomorrow. Log leads. Restock collateral." },
    { time: "5:30pm", title: "🏆 IFMA Gold & Silver Plate Awards Gala", sub: "Chicago Union Station · 500 W Jackson Blvd · $695/person · The industry's Oscars night", link: { url: "https://www.ifmaworld.com/GSP", label: "Register" } },
    { time: "Evening", title: "🎤 NRN MenuMasters Celebration", sub: "Morgan Manufacturing · 401 N Morgan St · Invite-only · Restaurant execs", link: { url: "https://menumastersevent.com/registration/", label: "Request Invite" } },
  ],
  sun: [
    { time: "9:00am", title: "Morning Team Meeting", sub: "Yesterday wins + adjustments for today" },
    { time: "9:30am", title: "SHOW FLOOR OPENS", sub: "Booth #7365 \u00b7 Full team on floor", highlight: "open" },
    { time: "All Day", title: "Booth Staffing + Podcast", sub: "Track all conversations with lead retrieval app" },
    { time: "All Day", title: "Walk the show floor", sub: "Check out neighbors \u00b7 attend key sessions" },
    { time: "5:00pm", title: "Show Floor Closes", highlight: "close" },
    { time: "4:00–7:00pm", title: "🍖 Flavor Forays BBQ & Cook-Off", sub: "Galleria Marchetti · 825 W Erie St · QSR/FSR Magazine co-host · ~1,000 chefs & operators", link: { url: "https://form.jotform.com/260204695689165", label: "Register" } },
    { time: "5:00–7:00pm", title: "🥩 WTWH Spring Networking Party", sub: "Prime & Provisions · 222 N LaSalle St · QSR & FSR Magazine hosts · Open registration", link: { url: "https://web.cvent.com/event/884fe172-050b-4289-bf5a-8dc8a581c0bf/register", label: "Register" } },
    { time: "5:00–7:00pm", title: "🍺 OCRA + Barmetrix Happy Hour", sub: "Chicago Firehouse · 1401 S Michigan Ave · Ohio Restaurant & Hospitality Alliance + Barmetrix · Walkable from McCormick", link: { url: "https://www.eventbrite.com/e/happy-hour-with-ocra-and-barmetrix-tickets-1987400391069", label: "RSVP on Eventbrite" } },
    { time: "5:00–7:00pm", title: "🎉 Young Professionals Networking Party", sub: "TAP @ Hyatt Regency McCormick · Under 35 · 21+ · $30/ticket", link: { url: "https://registration.experientevent.com/ShowNRA261/flow/ATT/", label: "Buy Ticket" } },
    { time: "Evening", title: "🏟️ The Utility Show (Day 1)", sub: "Mae District · 19 E 21st St · Free shuttle from McCormick", link: { url: "https://utilityshow.com/", label: "Get Tickets" } },
    { time: "7:00–10:00pm", title: "🍺 Buyers Edge Platform Afterparty", sub: "McCormick Place · Skee-ball, pop-a-shot, billiards · Free RSVP", link: { url: "https://nra.buyersedgeplatform.com/", label: "RSVP" } },
  ],
  mon: [
    { time: "9:00am", title: "Morning Team Meeting", sub: "Final push \u2014 biggest day" },
    { time: "9:30am", title: "SHOW FLOOR OPENS", highlight: "open" },
    { time: "All Day", title: "Max floor time + social media", sub: "Post with #2026RestaurantShow \u00b7 tag prospects" },
    { time: "5:00pm", title: "Show Floor Closes", highlight: "close" },
    { time: "Evening", title: "Final debrief + prep for tomorrow", sub: "Tomorrow closes at 3pm. Plan load-out early." },
    { time: "Evening", title: "🍺 RTN Annual Member Happy Hour", sub: "Fatpour Tap Works · Adjacent to McCormick · Free · Open to all", link: { url: "https://ensembleiq.swoogo.com/rtnhappyhour2026/begin", label: "Register" } },
    { time: "5:00–8:00pm", title: "🥂 Perfect Venue + Hostie Happy Hour", sub: "CTGMT (address TBD) · Hosted by Perfect Venue + Hostie · Free · ⚠️ Partiful lists 'Mon May 19' — verify date", link: { url: "https://partiful.com/e/UNIq668qsHy3Ovi9mFEz", label: "RSVP on Partiful" } },
    { time: "Evening", title: "🎉 IFBTA & CHART Celebration of Technology", sub: "Zed451 Rooftop · Restaurant tech + training pros", link: { url: "https://ifbta.member365.com/public/event/details/ddaca4140ceaa64a152c2c3bba225475b9f37c03", label: "Register" } },
    { time: "8:00–11:00pm", title: "🎸 Official Show After Party — House of Blues", sub: "329 N Dearborn St · Shift4 sponsor · Rod Tuffcurls & The Bench Press · Operators only · 21+", link: { url: "https://www.nationalrestaurantshow.com/home/show-after-party/", label: "Get Ticket" } },
  ],
  tue: [
    { time: "9:00am", title: "Morning Meeting", sub: "Final day \u2014 confirm load-out logistics" },
    { time: "9:30am", title: "SHOW FLOOR OPENS (LAST DAY)", highlight: "open" },
    { time: "3:00pm", title: "SHOW OFFICIALLY CLOSES", sub: "Do NOT teardown before this time", highlight: "close-final" },
    { time: "3:01pm", title: "Exhibitor Move-Out Begins", sub: "3:01pm \u2013 7:30pm move-out window" },
    { time: "8:35pm", title: "\u2708\ufe0f Kelly: ORD \u2192 DFW" },
  ],
}

export const dayTabs = [
  { key: "fri", label: "Fri May 15" },
  { key: "sat", label: "Sat May 16" },
  { key: "sun", label: "Sun May 17" },
  { key: "mon", label: "Mon May 18" },
  { key: "tue", label: "Tue May 19" },
]

// ── AFTER HOURS EVENTS ──
export interface AfterHoursEvent {
  id: string
  night: "fri" | "sat" | "sun" | "mon" | "tue" | "any"
  time?: string
  title: string
  host?: string
  venue: string
  address?: string
  cost: string
  access: "free" | "badge" | "rsvp" | "paid" | "operators" | "invite"
  link?: string
  notes?: string
  type: "party" | "dinner" | "awards" | "happy-hour" | "bar" | "meetup" | "spot"
  confirmed: boolean
}

export const afterHoursEvents: AfterHoursEvent[] = [
  // ── FRIDAY MAY 15 ──
  {
    id: "fri-prosper",
    night: "fri",
    time: "4:00 PM – 6:00 PM",
    title: "Prosper Accelerator Welcome Mixer",
    host: "Prosper Accelerator",
    venue: "Middleby Showroom",
    address: "222 W Merchandise Mart Plaza, Chicago",
    cost: "Free",
    access: "rsvp",
    link: "https://www.eventbrite.com/e/prosper-accelerator-welcome-mixer-tickets-1936131705049",
    notes: "Free networking with foodservice leaders. Friday May 15 — night before the show opens.",
    type: "happy-hour",
    confirmed: true,
  },

  // ── SATURDAY MAY 16 ──
  {
    id: "sat-r365-hh",
    night: "sat",
    time: "3:00 PM – 5:00 PM",
    title: "Restaurant365 In-Booth Happy Hour",
    host: "Restaurant365",
    venue: "Booth #6027 — McCormick Place Show Floor",
    cost: "Free",
    access: "badge",
    link: "https://www.restaurant365.com/events/tradeshows/nras/",
    notes: "Free drinks + demos. $25 Starbucks gift card after a demo. Also runs Sun & Mon.",
    type: "happy-hour",
    confirmed: true,
  },
  {
    id: "sat-intl-reception",
    night: "sat",
    time: "5:00 PM – 6:00 PM",
    title: "International Reception",
    host: "NRA Show",
    venue: "Vista Ballroom (Room S406) — McCormick Place",
    cost: "Free",
    access: "badge",
    link: "https://www.nationalrestaurantshow.com/home/international-reception/",
    notes: "Annual networking for global foodservice professionals. Included with international registrant badge.",
    type: "meetup",
    confirmed: true,
  },
  {
    id: "sat-ifma-gala",
    night: "sat",
    time: "5:30 PM cocktails · 6:30 PM dinner",
    title: "IFMA Gold & Silver Plate Awards Gala",
    host: "International Foodservice Manufacturers Assoc.",
    venue: "Chicago Union Station — Great Hall",
    address: "500 W Jackson Blvd, Chicago",
    cost: "$695/person · $6,295/table of 8",
    access: "paid",
    link: "https://www.ifmaworld.com/GSP",
    notes: "The industry's Oscars night. Gold Plate winner revealed at the ceremony. Non-refundable. Contact sandra@IFMAworld.com.",
    type: "awards",
    confirmed: true,
  },

  // ── SUNDAY MAY 17 ──
  {
    id: "sun-yp-toast",
    night: "sun",
    time: "4:00 PM – 4:30 PM",
    title: "Young Professionals Networking Toast",
    host: "NRA Show",
    venue: "Discovery Theater — South Hall, McCormick Place",
    cost: "Free",
    access: "badge",
    link: "https://www.nationalrestaurantshow.com/home/networking-meetups/",
    notes: "Short on-floor toast for industry professionals under 35. Senior pros welcome to stop by.",
    type: "meetup",
    confirmed: true,
  },
  {
    id: "sun-yp-party",
    night: "sun",
    time: "5:00 PM – 7:00 PM",
    title: "Young Professionals Networking Party",
    host: "NRA Show",
    venue: "TAP @ Hyatt Regency McCormick Place",
    address: "2233 S Martin Luther King Dr — Level 2",
    cost: "$30/ticket",
    access: "paid",
    link: "https://registration.experientevent.com/ShowNRA261/flow/ATT/",
    notes: "Under 35, must be 21+. Beverages + appetizers. Register through main NRA Show portal.",
    type: "party",
    confirmed: true,
  },
  {
    id: "sun-utility",
    night: "sun",
    time: "Evening",
    title: "The Utility Show (Day 1)",
    host: "Independent Restaurant Coalition + Southern Smoke Foundation",
    venue: "Mae District",
    address: "19 E 21st St, Chicago (0.5 mi from McCormick — free shuttle)",
    cost: "Ticketed",
    access: "rsvp",
    link: "https://utilityshow.com/",
    notes: "The indie alternative to NRA — vendor floor, panels, live pitch competition, community vibe. Free shuttle from McCormick.",
    type: "party",
    confirmed: true,
  },
  {
    id: "sun-buyersedge",
    night: "sun",
    time: "7:00 PM – 10:00 PM",
    title: "Buyers Edge Platform Afterparty",
    host: "Buyers Edge Platform",
    venue: "McCormick Place Convention Center",
    cost: "Free (RSVP required)",
    access: "rsvp",
    link: "https://web.cvent.com/event/c86fcd74-2dbe-40ad-b5af-75c1d3c8fa29/register",
    notes: "Cocktails + games (skee-ball, pop-a-shot, billiards, shuffleboard). Annual event, consistently fun.",
    type: "party",
    confirmed: true,
  },
  {
    id: "sun-dinner-hawksmoor",
    night: "sun",
    time: "7:00 PM – 10:00 PM",
    title: "Dinner Experience — Hawksmoor (Steakhouse)",
    host: "NRA Show",
    venue: "Hawksmoor",
    address: "500 N La Salle Dr, Chicago",
    cost: "$300/ticket (3-course + 3 drinks)",
    access: "paid",
    link: "https://registration.experientevent.com/ShowNRA261/flow/ATT/",
    notes: "Naturally raised beef + sustainably sourced seafood. Max 2 tickets per attendee. 21+. Register via main NRA portal.",
    type: "dinner",
    confirmed: true,
  },
  {
    id: "sun-dinner-momotaro",
    night: "sun",
    time: "7:00 PM – 10:00 PM",
    title: "Dinner Experience — Momotaro (Japanese)",
    host: "NRA Show",
    venue: "Momotaro",
    address: "820 W Lake St, Fulton Market District",
    cost: "$300/ticket (4-course + 2 drinks)",
    access: "paid",
    link: "https://registration.experientevent.com/ShowNRA261/flow/ATT/",
    notes: "4-course menu + exclusive maki making demo with Head Sushi Chef. 21+. Register via main NRA portal.",
    type: "dinner",
    confirmed: true,
  },
  {
    id: "sun-dinner-mosaic",
    night: "sun",
    time: "7:00 PM – 10:00 PM",
    title: "Dinner Experience — Mosaic w/ Chef Fabio Viviani",
    host: "NRA Show",
    venue: "Mosaic",
    address: "355 N Clark St, Chicago",
    cost: "$300/ticket (3-course + 2 drinks)",
    access: "paid",
    link: "https://registration.experientevent.com/ShowNRA261/flow/ATT/",
    notes: "Celebrity chef Fabio Viviani in attendance. 21+. Register via main NRA portal.",
    type: "dinner",
    confirmed: true,
  },
  {
    id: "sun-toast-reception",
    night: "sun",
    time: "Evening",
    title: "Toast Customer Reception",
    host: "Toast + Uber Eats + Coca-Cola",
    venue: "Off-site (TBD)",
    cost: "Free (invite-only)",
    access: "invite",
    notes: "Annual Toast customer-only event. Contact your Toast account rep for an invite. Not publicly announced.",
    type: "party",
    confirmed: true,
  },

  // ── MONDAY MAY 18 ──
  {
    id: "mon-utility",
    night: "mon",
    time: "Evening",
    title: "The Utility Show (Day 2)",
    host: "Independent Restaurant Coalition + Southern Smoke Foundation",
    venue: "Mae District",
    address: "19 E 21st St, Chicago — free shuttle from McCormick",
    cost: "Ticketed",
    access: "rsvp",
    link: "https://utilityshow.com/",
    notes: "Day 2 of the indie alternative to NRA. Free shuttle runs from McCormick Place.",
    type: "party",
    confirmed: true,
  },
  {
    id: "mon-ifbta",
    night: "mon",
    time: "Evening",
    title: "IFBTA & CHART Celebration of Technology",
    host: "IFBTA + Council for Hotel & Restaurant Trainers",
    venue: "Zed451 (Rooftop)",
    address: "Chicago, IL",
    cost: "Members + guests",
    access: "rsvp",
    link: "https://ifbta.member365.com/public/event/details/ddaca4140ceaa64a152c2c3bba225475b9f37c03",
    notes: "Annual rooftop networking event for restaurant tech + training professionals. Register through IFBTA.",
    type: "party",
    confirmed: true,
  },
  {
    id: "mon-afterparty",
    night: "mon",
    time: "8:00 PM – 11:00 PM",
    title: "Official Show After Party — House of Blues",
    host: "NRA Show (Sponsored by Shift4)",
    venue: "House of Blues Chicago",
    address: "329 N Dearborn St, Chicago",
    cost: "$125/ticket (open bar included)",
    access: "operators",
    link: "https://www.nationalrestaurantshow.com/home/show-after-party/",
    notes: "Live band: Rod Tuffcurls and The Bench Press. Operators only. Must be 21+. The big official party of the week.",
    type: "party",
    confirmed: true,
  },

  // ── TUESDAY MAY 19 ──
  {
    id: "tue-industry-night",
    night: "tue",
    time: "7:00 PM – 10:00 PM",
    title: "Industry Night Out — Time Out Market",
    host: "NRA Show",
    venue: "Time Out Market Chicago",
    address: "916 W Fulton Market, Chicago",
    cost: "$125/ticket",
    access: "operators",
    link: "https://www.nationalrestaurantshow.com/home/industry-night-out/",
    notes: "'Taste the Market' food experience + beverages + sponsor surprises. Operators only, 21+.",
    type: "party",
    confirmed: true,
  },

  // ── ANY NIGHT: Spots & Bars ──
  {
    id: "spot-fatpour",
    night: "any",
    title: "Fatpour Tap Works",
    venue: "Fatpour Tap Works",
    address: "2206 S Indiana Ave (steps from McCormick)",
    cost: "You pay your tab",
    access: "free",
    notes: "The unofficial post-show bar. Closest full bar to McCormick. Badge-wearers fill this from 5pm every night. Craft beer, burgers, two floors.",
    type: "spot",
    confirmed: true,
  },
  {
    id: "spot-hyatt-bar",
    night: "any",
    title: "Hyatt Regency Lobby Bar — TAP",
    venue: "Hyatt Regency McCormick Place",
    address: "2233 S Martin Luther King Dr (skybridge to McCormick)",
    cost: "You pay your tab",
    access: "free",
    notes: "On-campus via skybridge. Industry people congregate here every evening. No reservation needed.",
    type: "spot",
    confirmed: true,
  },
  {
    id: "spot-publican",
    night: "any",
    title: "The Publican",
    venue: "The Publican",
    address: "837 W Fulton Market (West Loop — 15 min rideshare)",
    cost: "You pay your tab",
    access: "free",
    link: "https://www.thepublichanrestaurant.com/",
    notes: "Industry favorite. Communal tables, Midwestern sourcing, great beer list. Reserve in advance — fills up during NRA week.",
    type: "spot",
    confirmed: true,
  },
  {
    id: "spot-girl-goat",
    night: "any",
    title: "Girl & the Goat",
    venue: "Girl & the Goat",
    address: "800 W Randolph St (West Loop — 15 min rideshare)",
    cost: "You pay your tab",
    access: "free",
    link: "https://www.girlandthegoat.com/",
    notes: "Stephanie Izard's flagship. Industry pilgrimage spot during NRA week. Reserve well in advance.",
    type: "spot",
    confirmed: true,
  },
  {
    id: "spot-kumiko",
    night: "any",
    title: "Kumiko (cocktails)",
    venue: "Kumiko",
    address: "630 W Lake St (West Loop — 15 min rideshare)",
    cost: "You pay your tab",
    access: "free",
    link: "https://www.barakumiko.com/",
    notes: "Japanese-inspired precision cocktails. Top-tier bar program. A must for beverage/bar industry people.",
    type: "spot",
    confirmed: true,
  },
  {
    id: "spot-threedots",
    night: "any",
    title: "Three Dots and a Dash (tiki bar)",
    venue: "Three Dots and a Dash",
    address: "435 N Clark St, River North (enter via alley off Hubbard)",
    cost: "You pay your tab",
    access: "free",
    link: "https://www.threedotschicago.com/",
    notes: "World's 50 Best Bars. Iconic Chicago tiki bar. The Bamboo Room is bookable for private groups.",
    type: "spot",
    confirmed: true,
  },
  {
    id: "sun-wtwh",
    night: "sun",
    time: "5:00 PM – 7:00 PM",
    title: "WTWH Spring Networking Party",
    host: "WTWH Media (QSR Magazine & FSR Magazine)",
    venue: "Prime & Provisions Steakhouse",
    address: "222 N LaSalle St, Chicago, IL 60601",
    cost: "Free (open registration)",
    access: "rsvp",
    link: "https://web.cvent.com/event/884fe172-050b-4289-bf5a-8dc8a581c0bf/register",
    notes: "Annual NRA week networking party hosted by the publishers of QSR and FSR magazines. Starts right as the show floor closes.",
    type: "happy-hour",
    confirmed: true,
  },
  {
    id: "sun-flavorforays",
    night: "sun",
    time: "4:00 PM – 7:00 PM",
    title: "Flavor Forays Annual Championship BBQ & Cook-Off",
    host: "Flavor Forays (Barbara Mathias & Beverly Stephen)",
    venue: "Galleria Marchetti",
    address: "825 W. Erie St., Chicago",
    cost: "Ticketed",
    access: "rsvp",
    link: "https://form.jotform.com/260204695689165",
    notes: "The industry's must-attend BBQ. Up to 1,000 of the industry's leading chefs and operators. Benefits World Central Kitchen and the Greater Chicago Food Depository.",
    type: "party",
    confirmed: true,
  },
  {
    id: "mon-rtn",
    night: "mon",
    time: "Evening",
    title: "RTN Annual Member Happy Hour",
    host: "Restaurant Technology Network",
    venue: "Fatpour Tap Works",
    address: "2206 S Indiana Ave (adjacent to McCormick Place)",
    cost: "Free",
    access: "rsvp",
    link: "https://ensembleiq.swoogo.com/rtnhappyhour2026/begin",
    notes: "Open to RTN members and non-members. RTN co-founder Abby Lorden presents 2026 roadmap. 'Come as you are.' The tech crowd's Monday night gathering.",
    type: "happy-hour",
    confirmed: true,
  },
  {
    id: "sat-perlick",
    night: "sat",
    time: "3:00 PM – 6:00 PM",
    title: "Perlick Happy Hour at NRA",
    host: "Perlick",
    venue: "Glessner House",
    address: "1800 S Prairie Ave, Chicago, IL 60616",
    cost: "Free (RSVP required)",
    access: "rsvp",
    link: "https://www.eventbrite.com/e/perlick-happy-hour-at-nra-tickets-1987447258250",
    notes: "Upscale happy hour at the historic Glessner House. Cocktails + light bites + live music by Robert Perlick-Molinari. Perlick = bar/back-bar refrigeration manufacturer. Walking distance from McCormick Place.",
    type: "happy-hour",
    confirmed: true,
  },
  {
    id: "mon-perfect-venue-hostie",
    night: "mon",
    time: "5:00 PM – 8:00 PM",
    title: "Perfect Venue + Hostie Happy Hour",
    host: "Perfect Venue + Hostie",
    venue: "CTGMT",
    address: "Chicago (address TBD on Partiful)",
    cost: "Free",
    access: "rsvp",
    link: "https://partiful.com/e/UNIq668qsHy3Ovi9mFEz",
    notes: "⚠️ Partiful page lists 'Monday, May 19' — May 19 is actually Tuesday in 2026. Added as Monday since that's the stated day name and 5–8pm aligns with show-still-open. VERIFY before attending. Perfect Venue = event-management SaaS, Hostie = hospitality comms automation. 10+ co-hosts listed.",
    type: "happy-hour",
    confirmed: true,
  },
  {
    id: "sun-ocra-barmetrix",
    night: "sun",
    time: "5:00 PM – 7:00 PM",
    title: "Happy Hour with OCRA + Barmetrix",
    host: "Ohio Restaurant & Hospitality Alliance + Barmetrix",
    venue: "The Chicago Firehouse Restaurant",
    address: "1401 S Michigan Ave, Chicago, IL 60605",
    cost: "Free (RSVP required)",
    access: "rsvp",
    link: "https://www.eventbrite.com/e/happy-hour-with-ocra-and-barmetrix-tickets-1987400391069",
    notes: "OCRA = Ohio Restaurant & Hospitality Alliance (John Barker's org — already on our podcast invite list). Barmetrix = bar inventory + beverage consulting firm. Casual format. Walkable from McCormick.",
    type: "happy-hour",
    confirmed: true,
  },
]

// ── TEAM ──
export interface TeamMember {
  name: string
  initials: string
  photo?: string
  shift?: "day" | "night" | "both"
  flights?: { label: string; detail: string }[]
  accommodation?: string
  notes?: string[]
  linkedin?: string
}

export const team: TeamMember[] = [
  {
    name: "Brian",
    initials: "B",
    photo: "/team/brian.jpg",
    flights: [
      { label: "✈️ SYR → ORD", detail: "May 15 · 10:36am · UA5964 Seat 7B" },
      { label: "✈️ ORD → SYR", detail: "May 20 · 10:35am" },
    ],
    accommodation: "🏠 Airbnb — Pilsen Home",
    linkedin: "https://www.linkedin.com/in/reece-brian/",
  },
  {
    name: "Rebecca",
    initials: "R",
    photo: "/team/rebecca.jpg",
    flights: [
      { label: "✈️ DFW → ORD", detail: "May 15 · 7:00am · AA1120 · Arrives 9:27am" },
      { label: "✈️ ORD → DFW", detail: "May 20 · 8:15am · AA481 · Arrives 10:53am" },
    ],
    accommodation: "🏨 Hilton Garden Inn Chicago Downtown/Magnificent Mile",
  },
  {
    name: "Maria",
    initials: "M",
    photo: "/team/maria.jpg",
    flights: [
      { label: "✈️ EZE → ORD", detail: "May 14 · 9:00am" },
      { label: "✈️ ORD → EZE", detail: "May 20 · 2:40pm" },
    ],
    accommodation: "🏨 Hilton Garden Inn Chicago Downtown/Magnificent Mile",
  },
  {
    name: "Steve",
    initials: "S",
    photo: "/team/steve.jpg",
    accommodation: "🏠 Airbnb — Pilsen Home",
    notes: ["🚗 Driving to Chicago"],
    linkedin: "https://www.linkedin.com/in/steve-crowley-445b507/",
  },
  {
    name: "Kelly",
    initials: "K",
    photo: "/team/kelly.jpg",
    flights: [
      { label: "✈️ DFW → ORD", detail: "May 15 · 9:30am" },
      { label: "✈️ ORD → DFW", detail: "May 19 · 8:35pm" },
    ],
    accommodation: "🏨 Hilton Garden Inn Chicago Downtown/Magnificent Mile",
  },
  {
    name: "Emily",
    initials: "Em",
    photo: "/team/emily.jpg",
  },
  {
    name: "Ellis",
    initials: "El",
    photo: "/team/ellis.jpg",
  },
]

// ── BOOTH ITEMS & COSTS ──
export interface CostItem {
  name: string
  amount: string
}

export const boothItems: CostItem[] = [
  { name: "32\" TV", amount: "SP owns" },
  { name: "Mr. Potato Head", amount: "SP owns" },
  { name: "Joy of Ops Neon Sign", amount: "SP to source" },
  { name: "Lancaster Barstools (\u00d74)", amount: "$166.56" },
  { name: "IKEA Docksta Table", amount: "$299.99" },
  { name: "Nomono Podcast Recorder", amount: "$1,799.00" },
  { name: "Ring Light & Stand", amount: "$49.95" },
  { name: "Joy of Ops Mugs (\u00d710)", amount: "$89.92" },
  { name: "Magnetic Whiteboard Easel", amount: "$50.88" },
  { name: "Standing Floor Plant", amount: "$59.99" },
  { name: "Podcast Table Plant", amount: "$12.99" },
  { name: "Cabinet Plants (\u00d73)", amount: "$107.97" },
]

export const showCosts: CostItem[] = [
  { name: "NRA Show Space", amount: "$4,825.00" },
  { name: "Freeman (booth + fabric wall)", amount: "$3,821.53" },
  { name: "Freeman (120V outlet)", amount: "$190.70" },
  { name: "VistaPrint (journals)", amount: "$404.29" },
  { name: "FedEx (case studies + boards)", amount: "$217.83" },
  { name: "FedEx (business cards \u00d72)", amount: "$224.11" },
  { name: "Rush Order Tees (all)", amount: "$736.26" },
  { name: "Staples + UPS (white papers)", amount: "$253.18" },
  { name: "Amazon / Flights / Hotel / Food", amount: "TBD" },
]

// ── KEY DATES ──
export interface KeyDate {
  label: string
  date: string
  variant: "muted" | "teal" | "red" | "green"
}

export const keyDates: KeyDate[] = [
  { label: "Advanced Freight to Freeman", date: "Apr 1", variant: "muted" },
  { label: "Freeman Discount Deadline", date: "Apr 13", variant: "teal" },
  { label: "Lead Retrieval Order Deadline", date: "Apr 2", variant: "teal" },
  { label: "Last Freight to Freeman Warehouse", date: "Apr 19\u201330", variant: "teal" },
  { label: "Display must be installed by", date: "May 15, 4pm", variant: "red" },
  { label: "Move-In Window", date: "May 11\u201315", variant: "green" },
  { label: "SHOW OPEN", date: "May 16\u201319", variant: "green" },
  { label: "Move-Out", date: "May 19\u201322", variant: "muted" },
]

// ── TALKING POINTS ──
export interface TalkingPoint {
  tag: string
  text: string
}

export const openers: TalkingPoint[] = [
  { tag: "OPENER 01", text: "\u201cWhat brings you to the show this year?\u201d \u2014 then listen for the pain point before pivoting to Service Physics." },
  { tag: "OPENER 02", text: "\u201cHave you ever mapped out exactly how your kitchen staff moves during a rush?\u201d \u2014 great way to introduce spaghetti diagrams." },
  { tag: "OPENER 03", text: "Point to the spaghetti board: \u201cThis is a real kitchen we analyzed \u2014 want to see what we found?\u201d \u2014 draws them in visually." },
]

export const coreMessages: TalkingPoint[] = [
  { tag: "WHO WE ARE", text: "Service Physics uses industrial engineering and operations science \u2014 the same disciplines used in Amazon warehouses and hospitals \u2014 applied to restaurant kitchens and service workflows." },
  { tag: "WHAT WE DO", text: "We reduce waste, unnecessary movement, and friction in restaurant operations. We make your existing team faster, safer, and less stressed \u2014 without replacing them with tech." },
  { tag: "THE SPAGHETTI DIAGRAM", text: "This is how we visualize movement. Every line is a step a person takes. The more tangled the diagram, the more waste in the operation. We untangle it." },
  { tag: "JOY OF OPS PODCAST", text: "We\u2019re recording live at the show. Invite them to be a guest \u2014 10-minute conversation on what they\u2019re seeing at NRA this year. Easy yes, and great content for both sides." },
]

export const objections: TalkingPoint[] = [
  { tag: "\u201cWE ALREADY HAVE A CONSULTANT\u201d", text: "\u201cThat\u2019s great \u2014 most of our clients have too. We\u2019re often brought in alongside existing partners because our method is very specific and measurement-based.\u201d" },
  { tag: "\u201cWE CAN\u2019T AFFORD IT RIGHT NOW\u201d", text: "\u201cTotally understand. Most clients see a clear ROI within 3\u20136 months. Happy to send a case study \u2014 what type of operation are you running?\u201d" },
  { tag: "\u201cWE\u2019RE A SMALL OPERATOR\u201d", text: "\u201cWe love working with independents \u2014 the impact is often most visible in smaller kitchens. What\u2019s your biggest headache right now?\u201d" },
]

// ── BOOTH SETUP ──
export const boothSetup = [
  { tag: "BACKDROP", text: "240\"W \u00d7 96\"H fabric back wall \u00b7 Logo left for podcast framing \u00b7 Graphic right" },
  { tag: "PODCAST SETUP", text: "Nomono recorder + Fovitec Ring Light Kit + \u201cOn Air\u201d tabletop sign \u00b7 Recording live during show hours" },
  { tag: "SCREENS", text: "32\" TV (SP-owned) on back wall \u00b7 Client logos looping on monitor" },
  { tag: "FURNITURE", text: "4\u00d7 Lancaster Backless Barstools \u00b7 IKEA Docksta Table \u00b7 Existing butcher paper table + cabinets" },
  { tag: "SPAGHETTI BOARD", text: "Magnetic Whiteboard Easel 36\u00d724\" on guitar stand" },
  { tag: "PROPS", text: "Mr. Potato Head \u00b7 Joy of Ops Neon Sign \u00b7 Joy of Ops Mugs (\u00d710) \u00b7 Artificial plants (succulent, hanging ivy, fern)" },
]

export const boothRules = [
  "No items over 4ft within 5ft of aisle",
  "No banners or signs in the aisles",
  "All materials must be fire-retardant",
  "Video only within booth, not into aisle",
  "No balloons or stickers",
  "Staff must stay within booth boundaries",
  "No early teardown before 3pm Tuesday",
  "Max 1-day supply of materials in booth",
  "Fire hose cabinets must stay unobstructed",
]

export const boothIncluded = [
  "8' back draping + two 33\" side rails",
  "Company name + booth number sign",
  "General overhead lighting",
  "Sanitary dishwashing facilities",
  "Customer invite allotment",
  "5 badges (first 100 sq ft) + 3 per additional 100 sq ft",
  "Listing in 2026 Show To Go (online directory)",
]

export const emailTemplate = `Subject: Great meeting you at NRA 2026 \u2014 [their name]

Hi [First Name],

It was great connecting with you at Booth #7365 during the National Restaurant Association Show last week.

[One personalized line about what you talked about \u2014 e.g. \u201cLoved hearing about your challenge with ticket times during peak hours.\u201d]

As mentioned, we help restaurant operations teams reduce waste and friction using the same industrial engineering methods used in hospitals and logistics \u2014 without replacing your people.

I\u2019ve attached [a case study / our white paper] that I think you\u2019ll find relevant to what you\u2019re working on.

Would love to schedule 30 minutes to show you what this looks like in practice for a [QSR / casual dining / etc.] operation like yours.

[LINK TO CALENDAR]

Looking forward to it,
[Your Name]
Service Physics
[Phone] | servicephysics.com`
