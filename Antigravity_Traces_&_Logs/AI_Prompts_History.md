# 📝 AetherFlow AI — Complete AI Prompts History

*Last Updated: 2026-07-02*


**Version:** Final Submission Build v3.0  
**Project:** AetherFlow AI  
**Team:** Team Scaller AI  
**Challenge:** AI Service Orchestrator for Informal Economy  
**Platform:** Antigravity + Gemini + Supabase + Next.js + Capacitor APK

---

# 1. UI + Frontend Generation Prompts

## Prompt — AETHERFLOW AI COMPLETE FRONTEND IMPLEMENTATION

```text
Build a complete futuristic mobile-first application called AetherFlow AI.

Theme:
Dark cyber UI
Neural interface
Glassmorphism
Premium mobile feel

Modules:

Resident:
Home
Request
AI Flow
Tracking
Profile

Technician:
Home
Jobs
Activity
Earnings
Profile

Rules:

Bottom navigation
Smooth animation
Mobile responsive
Capacitor safe
APK ready

Keep futuristic aesthetic.
```

---

## Prompt — Global Mobile Navigation

```text
Add global back navigation.

Pages:

request
booking
tracking
followup
providers
profile
orchestration
technician/jobs
technician/job/[id]
technician/profile
activity
earnings

Rules:

show only if history exists

router.back()

fallback:

Resident:

/home

Technician:

/technician/home

Prevent loops.
```

---

## Prompt — Password Visibility Toggle

```text
Add password visibility toggle.

Resident login
Resident signup
Technician login
Technician signup

States:

hidden
visible

Accessibility:

Show password
Hide password

Mobile safe.
```

---

# 2. Database + Supabase Prompts

## Prompt — Full Relational Schema

```text
Create PostgreSQL schema for AetherFlow AI.

Tables:

profiles
providers
requests
bookings
traces
orchestration_sessions
demo_logs

Requirements:

Role support:

resident
technician

Request:

service
priority
city
sector
block
street
house_no

Booking:

assigned
accepted
en_route
arrived
working
completed

Add RLS.

Resident sees own records only.
```

---

## Prompt — Session Memory Table

```text
Create orchestration_sessions table.

Fields:

request_id
booking_id
current_stage
timeline
selected_provider
ranking_score
status

Prevent duplicate sessions.

One request → one orchestration.
```

---

# 3. Agent Creation Prompts

## Prompt — Intent Agent

```text
Create IntentAgent.ts

Use:

GoogleGenerativeAI

Model:

gemini-2.5-flash

Extract:

service
priority
city
area
block
street
house_no
reasoning
full_address

Support:

English
Urdu
Roman Urdu

Examples:

AC thandi hawa nahi de raha

bijli wala

mistri

gulberg block b

Fallback:

dynamicExtract()

Regex parser.

Never fail pipeline.
```

---

## Prompt — Location Agent

```text
Create LocationAgent.

Responsibilities:

Geocode request

Extract:

city
area
sector
block
house

Use:

Nominatim

Fallback:

local parser

If API fails:

default city coordinates.

Never stop orchestration.
```

---

## Prompt — Provider Agent

```text
Create ProviderAgent.

Responsibilities:

Find technician.

Inputs:

service
location
availability

Output:

ranked providers.

Prevent duplicates.

One request:

one provider.
```

---

## Prompt — Ranking Agent

```text
Create RankingAgent.

Score:

distance
rating
experience
availability

Return:

best technician only.

Avoid double assignment.
```

---

---

# 4. Multimodal + Vision Prompts

## Prompt — Gemini Vision Engine

```text
Create Gemini image analyzer.

Input:

image
text

Analyze:

service
issue
location
urgency

Examples:

pipe leakage image

AC outdoor image

Electrical board

Output:

auto-fill fields:

intent
city
priority
schedule

Use Gemini only.

No OCR fallback.

If image fails:

continue text flow.
```

---

## Prompt — Voice Command Engine

```text
Enable voice command.

Support:

Urdu
English
Roman Urdu

Examples:

Pak Arab F1 Block Lahore AC leak

Need plumber in Johar Town

Extract:

service
full address
city
house no
priority
```

---

# 5. Orchestration Prompts

## Prompt — Complete AI Flow

```text
Flow:

INTENT

LOCATION

PROVIDER

RANKING

BOOKING

ASSIGNMENT

TRACKING

COMPLETE

No reruns.

No duplicate stages.

Create:

executedStages Set

Skip already executed stage.
```

---

## Prompt — Loader Hard Lock

```text
No loader >5 sec.

Use Promise.race()

Timeout:

auth 3 sec

intent 8 sec

provider 8 sec

ranking 8 sec

booking 8 sec

restore 10 sec

Unlock UI on failure.

No freeze.
```

---

## Prompt — Session Recovery

```text
If:

booking NULL

request NULL

completed

bad stage

reset session.

Do not restore broken state.

Prevent recovery loop.
```

---

# 6. Demo Mode Prompts

## Prompt — Autonomous Demo Engine

```text
Hackathon mode.

No technician action required.

Flow:

request

assign

accept

travel

arrive

work

complete

Automatically.

No manual clicks.
```

---

## Prompt — Simulation Realism

```text
Remove fake movement.

Use:

provider coords

request coords

Calculate:

distance
speed
ETA

Update every:

4 sec

Smooth interpolation.

No teleport.

Map:

must match request city.

Lahore → Lahore

No Islamabad fallback.
```

---

# 7. Stabilization Prompts

## Prompt — Infinite Loader Fix

```text
Search:

loading

pending

restore

spinner

polling

Kill infinite states.

All async:

Promise.race()

Never freeze.
```

---

## Prompt — Retry Removal

```text
Remove retry loops.

No:

protocol recovery spam

duplicate recovery

duplicate booking

duplicate traces

duplicate narrator
```

---

## Prompt — Termination Engine

```text
On:

completed

cancelled

Stop:

polling

timers

simulation

movement

retry

narrator

clearInterval()

clearTimeout()

terminal=true
```

---

# 8. APK Prompts

## Prompt — APK Build Lock

```text
Delete:

.next

out

Build:

npm run build

npx tsc --noEmit

npx cap sync android

Open:

npx cap open android

Verify:

auth

request

tracking

simulation

buttons

AI flow
```

---

# 9. Mobile Hotfix Prompts

## Prompt — Mobile Agentic Recovery

```text
Desktop works.

Fix mobile:

request

orchestration

tracking

image upload

voice

camera

textarea focus

keyboard overlap

safe area

webview upload

touch events

No mobile failure.
```

---

# 10. Debug + Recovery Prompts

## Prompt — Global Audit

```text
Run:

npm run build

npx tsc --noEmit

Collect:

runtime

hydration

SSR

routing

simulation

APK blockers

Priority:

CRITICAL

HIGH

MEDIUM
```

---

## Prompt — Turbopack Recovery

```text
Fix:

hydration mismatch

window usage

SSR crashes

localStorage

callback loops

SessionGuard

restoreSession

APK safe.
```

---

# Final Submission Statement

These prompts served as the operational backbone of the AetherFlow AI synthesis pipeline.

They were iteratively used during:

UI generation

database design

AI orchestration

multimodal implementation

mobile optimization

APK preparation

stabilization

demo locking

hackathon deployment

Result:

A complete AI-powered service orchestration platform with resident, technician, AI execution engine, orchestration monitoring, multimodal input, and APK deployment readiness.
