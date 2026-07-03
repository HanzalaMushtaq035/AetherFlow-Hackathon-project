# 🏗️ AetherFlow AI — System Architecture

*Last Updated: 2026-07-02*


**Version:** 2.0 Final | **Team:** Team Scaller AI

---

## 1. Frontend Architecture

### Technology: Next.js 16 + React 19 + TypeScript 5

```
src/app/                          # App Router (file-based routing)
├── page.tsx                      # Root redirect → /splash
├── layout.tsx                    # Global layout + font loading
├── globals.css                   # Tailwind CSS 4 design tokens
├── splash/page.tsx               # Animated splash screen
├── auth/page.tsx                 # Google OAuth login
├── onboarding/page.tsx           # Role selection (resident/technician)
├── home/page.tsx                 # Resident dashboard + request input
├── request/page.tsx              # Service request form (text + image)
├── orchestration/page.tsx        # Live AI agent orchestration visualization
├── booking/[id]/page.tsx         # Booking detail + live tracking
├── tracking/[id]/page.tsx        # Real-time Leaflet map tracking
├── trace/[id]/page.tsx           # Agent execution trace timeline
├── activity/page.tsx             # Request history
├── followup/[id]/page.tsx        # Post-booking follow-up
├── profile/page.tsx              # User profile management
├── providers/page.tsx            # Provider discovery results
├── technician/
│   ├── home/page.tsx             # Technician job queue dashboard
│   ├── jobs/page.tsx             # All assigned jobs list
│   ├── job/[id]/page.tsx         # Individual job detail + status controls
│   ├── activity/page.tsx         # Technician activity log
│   ├── earnings/page.tsx         # Earnings dashboard
│   ├── profile/page.tsx          # Technician profile
│   └── settings/page.tsx         # Technician settings
└── api/                          # Next.js API Routes
    ├── orchestrator/route.ts     # Full orchestration pipeline trigger
    ├── intent/route.ts           # Intent extraction endpoint
    ├── requests/route.ts         # Request CRUD
    ├── bookings/route.ts         # Booking operations
    ├── providers/route.ts        # Provider queries
    ├── traces/route.ts           # Trace retrieval
    └── health/route.ts           # Health check endpoint
```

### State Management: Zustand

| Store | File | Purpose |
|---|---|---|
| `useStore` | `src/store/useStore.ts` | Global app state: requests, bookings, providers, UI state |
| `authStore` | `src/store/authStore.ts` | Auth session, user profile, role |

### UI Components

```
src/components/
├── ai/                           # AI-specific UI components
├── booking/                      # Booking cards, detail views
├── provider/                     # Provider cards, rankings
└── shared/                       # Reusable: buttons, inputs, modals, loaders
```

---

## 2. Backend Architecture

### Supabase PostgreSQL + Next.js API Routes

All backend logic runs through two layers:
1. **Service Layer** (`src/lib/services/`) — Business logic classes
2. **API Routes** (`src/app/api/`) — HTTP endpoints wrapping services

### Service Layer

| Service | File | Responsibility |
|---|---|---|
| `RequestService` | `RequestService.ts` (525 lines) | CRUD requests, provider matching, trace logging, booking creation, follow-ups |
| `BookingService` | `BookingService.ts` (523 lines) | Status updates, OSRM routing, movement simulation, orchestration sessions, telemetry |
| `TraceService` | `TraceService.ts` (168 lines) | Agent trace creation/retrieval, deduplication, severity parsing |
| `NarratorService` | `NarratorService.ts` (311 lines) | Dynamic AI commentary, auto-narration from live traces |
| `DiscoveryEngine` | `DiscoveryEngine.ts` (194 lines) | Provider search with timeout, fallback providers, session caching |
| `ProviderService` | `ProviderService.ts` | Provider CRUD operations |

---

## 3. AI Agent Architecture

### Agent Pipeline (7 Sequential Stages)

```
User Input (text + image + location)
       │
       ▼
┌──────────────────┐
│  IntentAgent     │  → Gemini 2.5 Flash structured JSON extraction
│  (327 lines)     │  → Multilingual: English, Urdu, Roman Urdu
│                  │  → Multimodal: text + image fusion
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  LocationAgent   │  → OSM Nominatim geocoding
│  (211 lines)     │  → Cascading query specificity (5 levels)
│                  │  → In-memory geocode cache
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  ProviderAgent   │  → Supabase DB query by category
│  (1002 bytes)    │  → Global fallback scan if empty
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  RankingAgent    │  → Multi-dimensional scoring (100-point scale)
│  (172 lines)     │  → Distance (Haversine), Rating, Experience,
│                  │    Availability, Response Speed
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  BookingAgent    │  → Creates booking record
│  (691 bytes)     │  → One-request-one-booking constraint
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  AssignmentAgent │  → Assigns provider to booking
│  (574 bytes)     │  → Logs assignment trace
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  TraceAgent      │  → Final orchestration trace
│  (415 bytes)     │  → "Autonomous Orchestration Finalized"
└──────────────────┘
```

### Supporting Agents

| Agent | Purpose |
|---|---|
| `VisionAgent` (200 lines) | Gemini 2.5 Flash multimodal image analysis — detects object, damage, severity, service type |
| `OrchestratorAgent` (75 lines) | Coordinates all 7 agents sequentially with deduplication gate |

---

## 4. Database Schema

### 7 Tables in Supabase PostgreSQL

**profiles** — User accounts
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
role TEXT DEFAULT 'resident'
full_name TEXT NOT NULL
phone TEXT
avatar TEXT
created_at TIMESTAMPTZ
```

**providers** — Technician profiles
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles(id)
category TEXT NOT NULL
rating NUMERIC(3,2) DEFAULT 5.00
availability TEXT DEFAULT 'available'
location TEXT, service_area TEXT, city TEXT
working_hours_start TEXT, working_hours_end TEXT
specialization TEXT, experience_years INT
service_radius_km INT, verification_status TEXT DEFAULT 'pending'
completed_jobs INT DEFAULT 0
```

**requests** — Service requests
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles(id)
service TEXT NOT NULL, location TEXT
status TEXT DEFAULT 'pending'
raw_input TEXT, requested_time TEXT
priority TEXT, reasoning TEXT
image_url TEXT, city TEXT, area TEXT
block TEXT, street TEXT, house_no TEXT, full_address TEXT
```

**bookings** — Active bookings
```sql
id UUID PRIMARY KEY
request_id UUID REFERENCES requests(id)
provider_id UUID REFERENCES providers(id)
status TEXT DEFAULT 'confirmed'
scheduled_time TIMESTAMPTZ
provider_lat NUMERIC, provider_lng NUMERIC
user_lat NUMERIC, user_lng NUMERIC
eta_minutes INT, travel_status TEXT
```

**traces** — Agent execution log
```sql
id UUID PRIMARY KEY
request_id UUID REFERENCES requests(id)
agent TEXT NOT NULL, action TEXT NOT NULL
created_at TIMESTAMPTZ
```

**followups** — Post-booking messages
```sql
id UUID PRIMARY KEY
booking_id UUID REFERENCES bookings(id)
message TEXT NOT NULL, status TEXT DEFAULT 'pending'
```

**orchestration_sessions** — Live agent memory
```sql
id UUID PRIMARY KEY
request_id UUID REFERENCES requests(id) UNIQUE
booking_id UUID REFERENCES bookings(id)
current_stage TEXT DEFAULT 'INTENT'
status TEXT DEFAULT 'ORCHESTRATING'
timeline TEXT, selected_provider UUID
ranking_score NUMERIC DEFAULT 0.95
```

---

## 5. Data Flow Diagram

```
Resident App                    AI Layer                         Database
───────────                    ────────                         ────────
                                                               
[Text Input] ───────┐                                          
[Image Upload] ─────┤                                          
[Location] ─────────┤                                          
                    ▼                                          
              ┌─────────────┐                                   
              │ RequestService │──create──→ [requests table]    
              └──────┬──────┘                                   
                     │                                          
                     ▼                                          
              ┌─────────────┐     Gemini API                   
              │ IntentAgent  │◄────────────→ [Gemini 2.5 Flash]
              └──────┬──────┘                                   
                     │                                          
                     ▼                                          
              ┌──────────────┐    Nominatim                    
              │ LocationAgent │◄───────────→ [OSM Nominatim]   
              └──────┬───────┘                                  
                     │                                          
                     ▼                                          
              ┌──────────────┐                                  
              │ ProviderAgent │──query──→ [providers table]     
              └──────┬───────┘                                  
                     │                                          
                     ▼                                          
              ┌──────────────┐                                  
              │ RankingAgent  │──score──→ [ranked list]         
              └──────┬───────┘                                  
                     │                                          
                     ▼                                          
              ┌──────────────┐                                  
              │ BookingAgent  │──insert──→ [bookings table]     
              └──────┬───────┘                                  
                     │                                          
                     ▼                                          
              ┌────────────────┐                                
              │ AssignmentAgent │──update──→ [requests table]   
              └──────┬─────────┘                                
                     │                                          
                     ▼                                          
              ┌──────────────┐                                  
              │  TraceAgent   │──insert──→ [traces table]       
              └──────────────┘                                  
                                                               
              ┌────────────────┐                                
              │ NarratorService │──insert──→ [traces/demo_logs] 
              └────────────────┘                                
```

---

## 6. Security Layer

| Layer | Implementation |
|---|---|
| **Authentication** | Supabase Auth with Google OAuth 2.0 |
| **Authorization** | Row Level Security (RLS) on all 7 tables |
| **API Security** | Supabase anon key + authenticated role checks |
| **Data Isolation** | Users can only read/write their own profiles |
| **Input Validation** | UUID validation on all service method parameters |
| **Timeout Guards** | 8-second hard timeout on all Gemini API calls |
| **Deduplication** | Session, booking, and trace deduplication prevents data corruption |
| **Environment Variables** | All secrets in `.env.local` (not committed to git) |

---

## 7. External Integrations

| Service | Purpose | Endpoint |
|---|---|---|
| Google Gemini 2.5 Flash | Text intent extraction + image analysis | `generativelanguage.googleapis.com` |
| Supabase | Database, Auth, Real-time | `<project>.supabase.co` |
| OSM Nominatim | Geocoding addresses to coordinates | `nominatim.openstreetmap.org` |
| OSRM | Road network routing for technician tracking | `router.project-osrm.org` |
