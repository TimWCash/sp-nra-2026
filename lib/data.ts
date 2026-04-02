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
    { time: "5:00pm", title: "Show Floor Closes", highlight: "close" },
    { time: "Evening", title: "Daily Debrief", sub: "Adjust for tomorrow. Log leads. Restock collateral." },
  ],
  sun: [
    { time: "9:00am", title: "Morning Team Meeting", sub: "Yesterday wins + adjustments for today" },
    { time: "9:30am", title: "SHOW FLOOR OPENS", sub: "Booth #7365 \u00b7 Full team on floor", highlight: "open" },
    { time: "All Day", title: "Booth Staffing + Podcast", sub: "Track all conversations with lead retrieval app" },
    { time: "All Day", title: "Walk the show floor", sub: "Check out neighbors \u00b7 attend key sessions" },
    { time: "5:00pm", title: "Show Floor Closes", highlight: "close" },
    { time: "Evening", title: "QSR Networking Party", sub: "Check QSR Networking Party page for details" },
  ],
  mon: [
    { time: "9:00am", title: "Morning Team Meeting", sub: "Final push \u2014 biggest day" },
    { time: "9:30am", title: "SHOW FLOOR OPENS", highlight: "open" },
    { time: "All Day", title: "Max floor time + social media", sub: "Post with #2026RestaurantShow \u00b7 tag prospects" },
    { time: "5:00pm", title: "Show Floor Closes", highlight: "close" },
    { time: "Evening", title: "Final debrief + prep for tomorrow", sub: "Tomorrow closes at 3pm. Plan load-out early." },
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

// ── TEAM ──
export interface TeamMember {
  name: string
  initials: string
  photo?: string
  flights?: { label: string; detail: string }[]
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
    notes: ["🏠 Airbnb"],
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
  },
  {
    name: "Maria",
    initials: "M",
    photo: "/team/maria.jpg",
    flights: [
      { label: "✈️ EZE → ORD", detail: "May 14 · 9:00am" },
      { label: "✈️ ORD → EZE", detail: "May 20 · 2:40pm" },
    ],
    notes: ["🏠 Airbnb"],
  },
  {
    name: "Steve",
    initials: "S",
    photo: "/team/steve.jpg",
    notes: ["🚗 Driving to Chicago", "🏠 Airbnb"],
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
