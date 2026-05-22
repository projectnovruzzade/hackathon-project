You are a senior frontend engineer. Build a complete, production-ready
React + TypeScript web application called "Joint Holbies" with TWO
distinct user roles: Student Portal and Admin Panel.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- React 18 + TypeScript (strict mode)
- Vite (bundler)
- React Router v6 with nested routes
- Zustand (global state)
- TailwindCSS v3 (dark theme default)
- Framer Motion (page & micro animations)
- Recharts (charts and analytics)
- React Dropzone (CV upload)
- Lucide React (icons)
- clsx + tailwind-merge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTH & ROUTING SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create a mock auth system (no backend needed):

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatarColor: string;
}

Routes:
  /login               → LoginPage (role selector: Student | Admin)
  /student/*           → StudentLayout (protected, role=student)
  /admin/*             → AdminLayout (protected, role=admin)
  /                    → redirect based on role

Mock credentials:
  Student: student@teamforge.az / password
  Admin:   admin@teamforge.az / password

On login page: show two cards (Student / Admin), click to fill
credentials automatically, then submit. Show role-appropriate
dashboard after login.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
src/
  components/
    ui/           # Card, Badge, Button, Modal, ScoreRing, SkillChip,
                  # StatCard, StepIndicator, EmptyState, Avatar,
                  # Spinner, ProgressBar, Tooltip, Tabs
    layout/
      StudentLayout.tsx   # sidebar + topbar for student
      AdminLayout.tsx     # sidebar + topbar for admin
      Sidebar.tsx
      TopBar.tsx
    charts/
      SkillRadarChart.tsx
      TeamChemistryChart.tsx
      PerformanceLineChart.tsx
      SkillDistributionDonut.tsx
      ScoreBarsChart.tsx
  pages/
    LoginPage.tsx
    student/
      StudentDashboardPage.tsx
      StudentProfilePage.tsx
      StudentTeamPage.tsx
      StudentHackathonsPage.tsx
      StudentAnnouncementsPage.tsx
      StudentSupportPage.tsx
    admin/
      AdminDashboardPage.tsx
      AdminTeamsPage.tsx
      AdminTeamDetailPage.tsx
      AdminJudgesPage.tsx
      AdminEventsPage.tsx
      AdminParticipantsPage.tsx
      AdminCVAnalysisPage.tsx
      AdminReportsPage.tsx
      AdminAnnouncementsPage.tsx
  store/
    useAuthStore.ts
    useParticipantStore.ts
    useTeamStore.ts
    useEventStore.ts
    useJudgeStore.ts
    useAnnouncementStore.ts
  types/
    index.ts
  lib/
    mockData.ts
    api.ts
    utils.ts
  App.tsx
  main.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPESCRIPT TYPES (src/types/index.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type SkillCategory = 'frontend' | 'backend' | 'ml' | 'security' |
                     'devops' | 'design' | 'mobile' | 'other';
type EventType = 'hackathon' | 'ctf' | 'ideasprint' | 'buildathon';
type TeamStatus = 'forming' | 'active' | 'competing' | 'completed';
type JudgePermission = 'technical' | 'presentation' | 'innovation' |
                       'teamwork' | 'all';

interface Skill {
  name: string;
  level: SkillLevel;
  category: SkillCategory;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  skills: Skill[];
  experience: number;       // years
  previousTeams: string[];
  bio?: string;
  github?: string;
  linkedin?: string;
  cvUrl?: string;
  cvUploadedAt?: Date;
  cvExtractedSkills?: Skill[];
  university?: string;
  graduationYear?: number;
}

interface EventConfig {
  type: EventType;
  name: string;
  teamSize: number;
  idealProfile: Record<SkillCategory, number>;
  description: string;
}

interface HackathonEvent {
  id: string;
  name: string;
  type: EventType;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  teamCount: number;
  participantCount: number;
  prize?: string;
  registrationDeadline: Date;
  coverColor: string;   // tailwind gradient string
}

interface Team {
  id: string;
  name: string;
  members: Participant[];
  captainId: string;
  chemistryScore: number;
  missingSkills: SkillCategory[];
  eventType: EventType;
  eventId?: string;
  status: TeamStatus;
  createdAt: Date;
  description?: string;
  repositoryUrl?: string;
  projectName?: string;
}

interface Judge {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  specialization: string;
  permissions: JudgePermission[];
  maxPointsPerCriteria: number;   // e.g. 25 means max 25 pts each
  assignedEventIds: string[];
  totalReviews: number;
  bio?: string;
}

interface ScoreEntry {
  judgeId: string;
  teamId: string;
  eventId: string;
  scores: {
    technical: number;
    presentation: number;
    innovation: number;
    teamwork: number;
  };
  comment?: string;
  submittedAt: Date;
}

interface PerformanceReview {
  teamId: string;
  eventId: string;
  judgeScores: ScoreEntry[];
  aggregatedScores: {
    technical: number;
    presentation: number;
    innovation: number;
    teamwork: number;
    total: number;
  };
  rank?: number;
  aiFeedback?: string;
  reviewedAt: Date;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'event' | 'result' | 'general' | 'urgent';
  targetRole: 'all' | 'student' | 'admin';
  createdAt: Date;
  expiresAt?: Date;
  authorId: string;
  pinned: boolean;
  readBy: string[];  // participant IDs
}

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Date;
  response?: string;
  respondedAt?: Date;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MOCK DATA (src/lib/mockData.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate realistic Azerbaijani/international student data:

PARTICIPANTS (24 students):
  - Mix of Azerbaijani names (Ayla, Rauf, Nigar, Tural, Leyla,
    Fidan, Murad, Sevinc, Elvin, Narmina, Orhan, Zulfiyya...)
  - 4 experience tiers: 0-1yr (6), 1-3yr (8), 3-5yr (6), 5+yr (4)
  - Skills matching CS/engineering curriculum
  - Each has bio, github, linkedin fields populated
  - university: 'ADA University' | 'BHOS' | 'BSU' | 'UNEC' | 'Khazar'
  - Realistic CV upload timestamps

EVENTS (5 hackathons):
  - 2 completed: "Baku Tech Hackathon 2024", "CyberSec CTF Spring"
  - 1 ongoing: "AI Innovation Sprint 2025"
  - 2 upcoming: "Buildathon Summer 2025", "Mobile Dev Challenge"
  - Each with full details, prizes in AZN/USD

TEAMS (8 teams):
  - 6 completed teams from past events
  - 2 active teams in current event
  - Chemistry scores vary: 2 teams 80+, 3 teams 60-79, 3 teams below 60
  - Auto-generated names: "Binary Wolves", "Null Pointers",
    "Stack Overflow", "Git Blame", "404 Found", "Recursive Dreams"

JUDGES (6 judges):
  - Mix of industry professionals and academics
  - Different permission sets:
    Judge 1: all criteria, max 25 pts each (total 100)
    Judge 2: technical + innovation only, max 50 pts each
    Judge 3: presentation + teamwork, max 30 pts each
    Others: various combinations
  - Some assigned to multiple events

SCORE ENTRIES (realistic judge scores):
  - 3 score entries per completed team (from different judges)
  - Scores that match judge permissions (if judge can only score
    technical, other fields = null/0)
  - Varied scores with realistic distribution

ANNOUNCEMENTS (8 total):
  - 2 pinned urgent announcements
  - 3 event announcements
  - 3 general announcements
  - Mix of read/unread states

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLE 1: STUDENT PORTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Student sidebar navigation:
  🏠 Ana Səhifə (Dashboard)
  👤 Profil
  👥 Komanda
  🏆 Hackathonlar
  📢 Elanlar
  🎧 Dəstək

── STUDENT DASHBOARD PAGE ──
Top row — 4 animated StatCards:
  • My skill count  • Team chemistry score
  • Upcoming events  • Unread announcements

Center: "My Team at a Glance" section
  - If student has a team: show team card with
    SkillRadarChart (spider/radar chart showing team's
    skill coverage across: frontend, backend, ml, security,
    devops, design — filled polygon on a hexagon grid),
    member avatars, chemistry score ring, captain badge,
    "Missing skills" warning chips
  - If no team: EmptyState with "Join or create a team" CTA

Recent hackathon results panel:
  - Last 2 participated events
  - Score bars per criteria (technical/presentation/
    innovation/teamwork), color-coded
  - AI feedback snippet (truncated, "Read more" expands)

Announcements preview (last 3, unread highlighted)
Quick actions: "Upload CV", "Browse Events", "View Team"

── STUDENT PROFILE PAGE ──
Left panel — Avatar card:
  - Large colored avatar circle with initials
  - Name, university, graduation year
  - Bio (editable textarea inline)
  - GitHub / LinkedIn links (editable)
  - Experience years badge

Center — Two-tab layout:
  Tab 1: "Skills & CV"
    - CV Upload zone (drag & drop, PDF/DOCX/JPG/PNG)
    - Upload progress animation (uploading → extracting → done)
    - "AI Extracted Skills" section: shows extracted skills
      as chips, user can approve/remove each
    - Manual skill editor: add skill with name, level,
      category dropdowns; delete existing skills
    - Skills grid: grouped by category with level badges

  Tab 2: "Hackathon History"
    - Timeline list of all participated hackathons
    - Each item: event name, date, team name, final score
    - PerformanceLineChart: line chart showing total score
      trend across events (x=event, y=score 0-100)
    - "Best performance" highlight card

Right panel — Skill summary:
  - Skill count by category (mini bar chart)
  - Top 3 strongest skills highlighted
  - Experience badge (color by years)

── STUDENT TEAM PAGE ──
If student is IN a team:
  Header: Team name, status badge, event badge

  Members section:
    - Grid of member cards (avatar, name, skills top-3,
      role chip)
    - Captain card has star icon + gradient border
    - Hover: expand member card showing all skills

  Team Analytics section (key part with charts):
    - SkillRadarChart: hexagonal radar showing team's
      aggregate skill coverage (0-5 scale per category),
      overlay showing "ideal profile" for event type as
      dashed line
    - TeamChemistryChart: animated circular gauge 0-100,
      color: green(80+)/yellow(60-79)/red(<60)
    - "Missing skills" panel: list of skill gaps with
      "Find a teammate" button per gap
    - ScoreBarsChart: if team has competed, show score
      breakdown per judge (grouped bar chart, each judge
      a different color)

  Team info sidebar:
    - Project name (editable by captain)
    - Repository URL (editable by captain)
    - Event they're competing in
    - Team creation date

If student is NOT in a team:
  - EmptyState with illustration
  - "Browse available teams to join" list
  - "Create new team" button opens a modal with:
    - Team name input
    - Event selector
    - Description textarea
    - Submit button

── STUDENT HACKATHONS PAGE ──
Top: Filter tabs — All / Upcoming / Ongoing / Completed

Events grid (3 columns on desktop):
  Each event card:
    - Colored header bar (coverColor)
    - Event name, type badge, dates
    - Location, status badge
    - Prize display
    - Participant & team count chips
    - "Register" (upcoming) / "View Results" (completed)
      / "View Live" (ongoing) button

Selected event detail (right panel or modal):
  - Full description
  - Timeline bar (registration → start → end)
  - Participating teams list (mini cards)
  - If completed: leaderboard table
    (rank, team name, total score, medal emoji for top 3)
  - Score breakdown for student's own team (if participated)
    with per-judge breakdown table:
      Columns: Judge | Technical | Presentation |
               Innovation | Teamwork | Total
      Each judge's scores shown (greyed if no permission)
      Row for aggregated average

── STUDENT ANNOUNCEMENTS PAGE ──
Left: Announcement list
  - Pinned announcements at top with 📌
  - Type color coding: urgent=rose, event=violet,
    result=emerald, general=slate
  - Unread items have glowing left border
  - "Mark all read" button

Right: Selected announcement detail
  - Full content render
  - Author, date, type badge
  - Mark as read on open

── STUDENT SUPPORT PAGE ──
Left: FAQ accordion
  - 8 common questions about hackathons, team building,
    scoring, etc.

Right: Support ticket form
  - Subject dropdown (Technical Issue / Team Issue /
    Event Question / Other)
  - Message textarea
  - Submit creates a mock ticket

Below: My Tickets list
  - Status chips: open (amber), in_progress (blue),
    resolved (emerald)
  - Each ticket expandable showing response if resolved

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLE 2: ADMIN PANEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Admin sidebar navigation:
  📊 Dashboard
  👥 İştirakçılar
  🤝 Komandalar
  🏆 Tədbirlər
  ⚖️  Münsiflər
  📄 CV Analizi
  📢 Bildirişlər
  📈 Hesabatlar

── ADMIN DASHBOARD PAGE ──
Top stats row (6 StatCards with animated counters):
  Total Participants | Active Teams | Events This Year |
  Avg Chemistry Score | Total Judges | Open Support Tickets

Main content grid (2 columns):

Left column:
  - SkillDistributionDonut: donut chart of skill categories
    across ALL participants, with legend
  - Recent activity feed: last 8 actions (team created,
    CV uploaded, score submitted, announcement posted)
    with timestamp and actor

Right column:
  - "Events Overview" timeline card: horizontal bar chart
    (Gantt-style) showing event dates
  - Top performing teams: ranked list with chemistry
    score bars
  - Quick actions panel:
    • "Create Event" | "Add Judge" | "Post Announcement"
      | "Generate Teams" (each opens modal)

── ADMIN PARTICIPANTS PAGE ──
Toolbar: Search by name/email | Filter by skill category |
  Filter by experience range | Filter by university |
  Sort dropdown (name/experience/skills/activity) |
  "Add Participant" button

Table view (default) with columns:
  Avatar+Name | University | Experience | Top Skills |
  Team | CV Status | Actions

Card view toggle: same data as participant cards

Participant detail drawer (slides from right on click):
  - Full profile info
  - All skills with level badges
  - Team history
  - CV upload status + extracted skills
  - Edit button (opens edit modal)
  - Delete button (with confirmation)

Bulk actions: select multiple → assign to event / remove

── ADMIN TEAMS PAGE ──
Filter bar: by event | by status | by chemistry score range |
  search by name

Teams grid:
  Each team card:
    - Name + event badge + status badge
    - Member avatars row (max 5 visible, +N more)
    - Captain highlighted
    - Chemistry score ring (animated SVG)
    - Color border: green(80+) / amber(60-79) / rose(<60)
    - Missing skills chips
    - Action buttons: View Detail | Edit | Dissolve

"Generate Teams" floating button:
  Opens 3-step wizard modal:
  Step 1 — Select Event:
    Radio cards for each active event
  Step 2 — Configure:
    Team size slider (2-8)
    Toggle: Avoid previous teammates
    Toggle: Diversify experience levels
    Toggle: Prioritize skill balance
  Step 3 — Preview & Generate:
    Show "X teams will be created from Y participants"
    "Generate" button triggers mock AI algorithm (1.5s)
    Show generated teams preview before confirming

── ADMIN TEAM DETAIL PAGE ──
Header: Team name, edit icon, event badge, status badge,
  "Dissolve Team" danger button

Two-column layout:
Left — Members management:
  - Member cards with role (captain/member)
  - "Transfer Captain" button
  - "Remove Member" per member
  - "Add Member" (search & select from participants)
  - Skill overlap visualization: which skills overlap
    between members (displayed as Venn-like chips)

Right — Scoring panel (the core admin feature):
  "Judge Scores" section:
    Table: Judge Name | Technical | Presentation |
           Innovation | Teamwork | Total | Submitted At
    - Each row: judge's allowed criteria cells are
      white/active, disallowed cells are greyed with
      "—" and tooltip "Judge not permitted for this"
    - Submitted scores shown as numbers + mini progress
      bars within cells
    - "Pending" badge if judge hasn't scored yet
    - "Override Score" button per row (admin privilege)

  "Aggregate Scores" card:
    - Weighted average per criteria
    - Total out of 100
    - Rank badge (if event has concluded)
    - PerformanceLineChart: this team's score trend

  "AI Feedback" section:
    "Generate AI Feedback" button →
    2s mock streaming text animation showing improvement
    suggestions, strengths, areas to work on

── ADMIN JUDGES PAGE ──
Header: "Judges" title + "Add Judge" button

Judges table with columns:
  Avatar+Name | Email | Specialization |
  Assigned Events | Permissions | Max Points | Actions

Permission pills visualized:
  Each judge card/row shows permission badges:
  - [Technical: 25pts] [Presentation: 25pts] etc.
  - Greyed-out criteria = not permitted

"Add / Edit Judge" modal with full form:
  Name, Email, Bio, Specialization (dropdown:
    Industry Expert / Academic / Alumni / Guest)
  Assign to events (multi-select checkboxes)
  Permission configurator (the KEY feature):
    4 toggle switches (Technical / Presentation /
    Innovation / Teamwork)
    For each ENABLED criterion: a number input for
    max points (default 25, range 1-100)
    Shows running total: "Max total score: X pts"
    Warning if total ≠ 100: "Scores will be normalized"
  Save button

Judge detail side panel:
  - All assigned events
  - Scores submitted count
  - Pending scores count
  - Score history table

── ADMIN EVENTS PAGE ──
Calendar-style header showing current month events

Events list with status filtering

"Create Event" modal (full form):
  Name, Type (4 event cards), Description
  Start/End dates (date pickers)
  Registration deadline
  Location, Prize
  Max team size, Max participants
  Team building method:
    Manual / AI-Assisted / Open registration

Event detail expandable:
  - Registered teams list
  - Participant roster
  - Judge assignments (assign judges from pool)
  - Event timeline
  - "Close Registration" / "Start Event" /
    "End Event" status buttons

── ADMIN CV ANALYSIS PAGE ──
Upload zone at top: bulk PDF/DOCX upload

Processing queue:
  - File list with status: queued / processing / done / error
  - Progress bar per file
  - "Process All" button

Results section:
  For each processed CV:
    - Participant name (extracted or "Unknown")
    - Confidence score
    - Extracted skills chips with "Approve" / "Edit" per skill
    - "Create Participant" button → pre-fills new participant
      form with extracted data

Campus skill gap analysis:
  - Bar chart: skill categories by participant count
  - "Missing Skills" heatmap: which event types would
    fail due to missing skills
  - Recommendation: "Recruit 3 more ML engineers for
    AI Innovation Sprint"

── ADMIN REPORTS PAGE ──
Date range picker + Event filter

Report cards (4 types, each expandable):

1. "Team Performance Report"
   - Table: team, event, avg score, rank, chemistry
   - ScoreBarsChart grouped by event
   - Export CSV button (mock)

2. "Participant Skills Report"
   - SkillDistributionDonut per event
   - Top 10 skills by frequency bar chart
   - Experience distribution histogram

3. "Judge Activity Report"
   - Judge scoring completion rates
   - Average scores given per judge per criteria
   - "Score bias" note if a judge consistently scores
     high/low vs average

4. "Event Summary Report"
   - Event-by-event comparison
   - Participation trends line chart
   - Team formation time average

── ADMIN ANNOUNCEMENTS PAGE ──
Left: Announcement list (same as student view)
  + admin sees ALL announcements regardless of targetRole
  + "Edit" and "Delete" per announcement

Right: Create/Edit form:
  Title, Content (textarea with basic formatting hints)
  Type selector (4 colored cards)
  Target audience (All / Students / Admins)
  Expiry date (optional)
  Pin toggle
  Preview → Send

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI / DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dark theme default. Color palette:
  Primary:    violet-600 (#7C3AED) — student role accent
  Secondary:  cyan-500 (#06B6D4) — admin role accent
  Surface:    slate-900 (bg), slate-800 (cards)
  Text:       slate-100 (primary), slate-400 (secondary)
  Success:    emerald-400
  Warning:    amber-400
  Danger:     rose-400

Student layout uses violet accents throughout.
Admin layout uses cyan/teal accents throughout.
This helps users immediately understand which role they are.

Glassmorphism cards: bg-white/5 backdrop-blur border-white/10
Gradient page backgrounds: subtle radial gradient on dark bg
Framer Motion: page transitions (fade+slide), card entrances
Micro-animations: hover scale, glow effects on interactive elements
8px grid spacing throughout.

Reusable UI components:
  <Card>          glass card, optional gradient border prop
  <Badge>         skill level chips, category color coding
  <ScoreRing>     SVG circular progress (0-100), animated
  <SkillChip>     colored pill by category
  <StatCard>      metric + icon + animated counter (useCountUp)
  <StepIndicator> wizard progress (dots with labels)
  <EmptyState>    icon + message + optional CTA button
  <Avatar>        colored initial circle, size variants
  <Modal>         centered overlay with backdrop blur
  <Drawer>        slides in from right, used for detail panels
  <ProgressBar>   animated fill bar
  <Tooltip>       hover info popup

SkillRadarChart (IMPORTANT — custom implementation):
  Use Recharts RadarChart component.
  6 axes: frontend, backend, ml, security, devops, design
  Show two filled polygons:
    1. Team's actual coverage (violet, 60% opacity)
    2. Event's ideal profile (cyan dashed, 30% opacity)
  Legend: "Your team" | "Ideal profile"
  Smooth animations on mount.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZUSTAND STORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useAuthStore:
  currentUser: AuthUser | null
  isAuthenticated: boolean
  login(email, password): Promise<boolean>
  logout(): void

useParticipantStore:
  participants: Participant[]
  isLoading: boolean
  addParticipant(p): void
  updateParticipant(id, updates): void
  removeParticipant(id): void
  getById(id): Participant | undefined
  filterBySkill(category): Participant[]
  filterByExperience(min, max): Participant[]

useTeamStore:
  teams: Team[]
  isLoading: boolean
  generateTeams(participants, config): Promise<Team[]>
  addTeam(t): void
  updateTeam(id, updates): void
  dissolveTeam(id): void
  getTeamByParticipant(participantId): Team | undefined
  performanceReviews: PerformanceReview[]
  addReview(r): void

useEventStore:
  events: HackathonEvent[]
  selectedEventId: string | null
  selectEvent(id): void
  addEvent(e): void
  updateEvent(id, updates): void
  getById(id): HackathonEvent | undefined

useJudgeStore:
  judges: Judge[]
  scoreEntries: ScoreEntry[]
  addJudge(j): void
  updateJudge(id, updates): void
  removeJudge(id): void
  submitScore(entry: ScoreEntry): void
  getScoresForTeam(teamId, eventId): ScoreEntry[]
  getAggregatedScore(teamId, eventId): AggregatedScore

useAnnouncementStore:
  announcements: Announcement[]
  addAnnouncement(a): void
  updateAnnouncement(id, updates): void
  deleteAnnouncement(id): void
  markAsRead(announcementId, userId): void
  getUnreadCount(userId): number

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MOCK API (src/lib/api.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Auth
login(email, password): Promise<AuthUser | null>
  → 0.8s delay, checks mock credentials

// CV processing
extractSkillsFromCV(file: File): Promise<Partial<Participant>>
  → 2s delay with progress callbacks, returns mock data

// Team building AI
buildTeams(participants, config): Promise<Team[]>
  → 1.5s delay, greedy skill-balancing algorithm:
    Sort participants by skill diversity
    Greedily assign to teams ensuring skill coverage
    Calculate chemistry score based on:
      skill complementarity (40%)
      experience diversity (30%)
      no previous team overlap (30%)

// AI feedback (streams mock text)
getAIFeedback(review: PerformanceReview): Promise<string>
  → 2s delay, returns a 150-word mock feedback string
     mentioning specific score criteria

// Reports
generateReport(type, filters): Promise<ReportData>
  → 1s delay, returns mock aggregated data

All functions: proper TypeScript generics, error handling,
realistic delays.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN PAGE DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full-page dark background with subtle geometric pattern.
Centered card:
  Logo: lightning bolt + "TeamForge AI" bold heading
  Subtitle: "Hackathon Team Management Platform"

  Role selector — two clickable cards side by side:
    [🎓 Student]  [⚙️ Admin]
    Click auto-fills email/password fields

  Email input (pre-filled)
  Password input (pre-filled)
  Login button (full width, violet gradient)
  
  Below: small text "Demo mode — credentials auto-filled"

On success: animate page transition to role dashboard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIDEBAR DESIGN (both layouts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width: 240px desktop, collapsible to 64px (icon only)
Mobile: bottom navigation bar (5 items max)

Top: Logo area + app name
Middle: Nav items
  Active: accent color background pill, icon + label
  Inactive: icon + label, hover brightens
Bottom:
  Current user avatar + name + role badge
  Logout button

Student sidebar accent: violet
Admin sidebar accent: cyan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORE SYSTEM RULES (important logic)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Implement this judge scoring logic precisely:

1. Each judge has permissions (subset of 4 criteria)
   and maxPointsPerCriteria for each permitted criterion.

2. When displaying a score table for a team:
   - Show all 4 criteria columns always
   - For a judge's row: show their score in permitted
     columns, show "—" with greyed background in
     non-permitted columns
   - Tooltip on "—": "This judge is not assigned to
     score this criterion"

3. Aggregation:
   For each criterion, average only the judges who
   have permission for it (ignore "—" entries).
   Final total = sum of all 4 criteria averages,
   normalized to 0-100.

4. If a judge's max is not 25 (e.g. 50 for one criterion),
   normalize their score: (score / maxPoints) * 25
   before aggregating with other judges.

5. Display normalized scores in the aggregate row,
   but show raw scores in each judge's own row.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOYMENT CONFIG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Path aliases: @/ = src/
- vite.config.ts: base: './'
- tsconfig.json: strict: true, paths configured
- tailwind.config.ts: darkMode: 'class', content paths
- package.json scripts: dev, build, preview
- .gitignore: node_modules, dist, .env*
- No process.env (use import.meta.env)
- No hardcoded localhost URLs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERABLES — OUTPUT ALL FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output every file completely — never truncate.
Order:
  package.json
  vite.config.ts
  tsconfig.json
  tailwind.config.ts
  src/types/index.ts
  src/lib/mockData.ts
  src/lib/api.ts
  src/lib/utils.ts
  src/store/useAuthStore.ts
  src/store/useParticipantStore.ts
  src/store/useTeamStore.ts
  src/store/useEventStore.ts
  src/store/useJudgeStore.ts
  src/store/useAnnouncementStore.ts
  src/components/ui/* (all UI components)
  src/components/charts/* (all chart components)
  src/components/layout/Sidebar.tsx
  src/components/layout/TopBar.tsx
  src/components/layout/StudentLayout.tsx
  src/components/layout/AdminLayout.tsx
  src/pages/LoginPage.tsx
  src/pages/student/* (all 6 pages)
  src/pages/admin/* (all 8 pages)
  src/App.tsx
  src/main.tsx

For each file output:
--- FILE: path/to/file.tsx ---
[full content]
--- END FILE ---