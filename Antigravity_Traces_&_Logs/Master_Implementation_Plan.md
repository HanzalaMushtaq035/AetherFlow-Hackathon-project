# 🗺️ AetherFlow AI — Master Implementation Plan

*Last Updated: 2026-07-02*


**Version:** 2.0 Final | **Team:** Team Scaller AI | **Timeline:** May 13–19, 2026

---

## 1. Milestones

| # | Milestone | Date | Status |
|---|---|---|---|
| M1 | Foundation Complete (Next.js + Supabase + Auth) | May 13 | ✅ |
| M2 | Agent Pipeline V1 (Intent → Provider → Booking) | May 14 | ✅ |
| M3 | Full Orchestration (7-agent pipeline) | May 15 | ✅ |
| M4 | Technician Fulfillment (6-stage workflow + OSRM) | May 16 | ✅ |
| M5 | Multimodal Engine (VisionAgent + image classification) | May 16 | ✅ |
| M6 | Narrator Intelligence (AI commentary layer) | May 17 | ✅ |
| M7 | Hard Lock Stabilization (zero infinite loading) | May 18 | ✅ |
| M8 | APK Production Build (Capacitor Android) | May 19 | ✅ |
| M9 | Documentation (15 submission artifacts) | May 19 | ✅ |

## 2. Phase Breakdown

### Phase 1: Foundation
- Next.js 16 scaffolding with TypeScript, App Router, Tailwind CSS v4
- Supabase PostgreSQL schema: profiles, providers, requests, bookings, traces, followups, orchestration_sessions
- Google OAuth via Supabase Auth with SSR middleware
- Mobile-first UI shell, onboarding, splash, role-based routing

### Phase 2: AI Core
- IntentAgent — Gemini 2.5 Flash structured JSON extraction (multilingual)
- Dynamic Fallback Parser — regex NLP for offline scenarios
- LocationAgent — OSM Nominatim geocoding with cascading queries + cache
- ProviderAgent — DB query with global fallback scan
- RankingAgent — Multi-dimensional scoring (Haversine distance, rating, experience, availability)
- OrchestratorAgent — Sequential pipeline with deduplication gate

### Phase 3: Fulfillment
- BookingAgent + AssignmentAgent with one-request-one-booking constraint
- Technician Panel — 7 sub-pages (home, jobs, job detail, activity, earnings, profile, settings)
- Real-time Tracking — Leaflet + OSRM road network routing, 3-second simulation
- VisionAgent — Gemini 2.5 Flash multimodal with 8s timeout guard
- NarratorService — Dynamic commentary from live trace data
- TraceService — Full observability with severity, deduplication, JSON payloads

### Phase 4: Stabilization
- Global timeout enforcement via `Promise.race()` on all async ops
- Session deduplication preventing re-execution of completed stages
- Trace deduplication — 10-second window duplicate detection
- Single interval policy via `activeIntervals` Map
- Capacitor Android APK build with static export
- QA simulation via automated scratch scripts

## 3. Technical Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion, Lucide Icons |
| State | Zustand 5 |
| Maps | Leaflet 1.9 + React-Leaflet 5 + OpenStreetMap |
| AI | Google Gemini 2.5 Flash (@google/generative-ai 0.24.1) |
| Database | Supabase PostgreSQL + Row Level Security |
| Auth | Supabase Auth (Google OAuth) |
| Geocoding | OSM Nominatim |
| Routing | OSRM (Open Source Routing Machine) |
| Mobile | Capacitor 8 (Android APK) |

## 4. Dependencies Graph

IntentAgent depends on: Gemini 2.5 Flash API
LocationAgent depends on: OSM Nominatim API, RequestService
ProviderAgent depends on: Supabase providers table
RankingAgent depends on: ProviderAgent output, Haversine formula
BookingAgent depends on: RankingAgent output, Supabase bookings table
AssignmentAgent depends on: BookingAgent output
TraceAgent depends on: All agent outputs, Supabase traces table
OrchestratorAgent depends on: All 7 agents sequentially
VisionAgent depends on: Gemini 2.5 Flash multimodal API
NarratorService depends on: TraceService, BookingService
DiscoveryEngine depends on: RequestService, BookingService

## 5. Delivery Strategy

1. **Iterative** — Working demos at every milestone
2. **AI-Assisted** — Antigravity used for code generation, debugging, architecture
3. **Test-As-You-Build** — QA scripts after every major feature
4. **Zero-Downtime Stabilization** — Phase 4 freezes features, focuses on reliability
5. **APK-First** — Capacitor static export for native Android

**Total effort: 30 hours across 6 days.**
