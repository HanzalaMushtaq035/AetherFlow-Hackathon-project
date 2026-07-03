# 🚀 AetherFlow AI — Intelligent Service Orchestration Platform

*Last Updated: 2026-07-02*


<div align="center">

### AI-Powered Service Orchestration System for the Informal Economy

**Challenge Submission Project**

Resident → AI Orchestration → Technician Assignment → Live Tracking → Completion

Built using **Next.js + Supabase + Gemini + Capacitor**

APK file --> "https://drive.google.com/file/d/1-agbDQvWJ6AqlFczwlHrVmQ3u0euQEL7/view?usp=sharing"

</div>

---

# 📌 Overview

AetherFlow AI is an intelligent service orchestration platform designed for the informal service economy.

The platform allows residents to submit service requests using **text**, **voice**, and **image inputs**, while AI agents automatically:

- Understand user intent
- Extract location
- Find providers
- Rank technicians
- Generate bookings
- Assign jobs
- Simulate tracking
- Complete workflows autonomously

The platform includes:

✅ Resident App  
✅ Technician App  
✅ AI Agent Pipeline  
✅ Real-time Tracking  
✅ Multimodal Input System  
✅ APK Deployment Support

---

# 🧠 AI Orchestration Pipeline

AetherFlow uses a multi-agent execution system:

```text
Intent Agent
      ↓
Location Agent
      ↓
Provider Agent
      ↓
Ranking Agent
      ↓
Booking Agent
      ↓
Assignment Agent
      ↓
Tracking Engine
      ↓
Completion
```

---

# ✨ Features

## Resident Side

- Service request creation
- Text request support
- Voice command support
- Image upload support
- AI request analysis
- Tracking page
- Booking lifecycle monitoring
- Request cancellation
- Profile system
- Activity logs

---

## Technician Side

- Job dashboard
- Active operations
- Accept workflow
- Travel simulation
- Arrival stage
- Work stage
- Completion stage
- Earnings dashboard
- Activity tracking
- Profile management

---

## AI Features

### Intent Extraction

Supports:

- English
- Urdu
- Roman Urdu

Examples:

```text
Need plumber in Johar Town

Pak Arab F1 Lahore AC leak

AC thandi hawa nahi de raha
```

AI extracts:

- Service
- City
- Area
- Sector
- Block
- Street
- House Number
- Priority

---

### Multimodal Vision

Inputs:

- Image only
- Text only
- Image + Text

Examples:

Pipe leakage image

AC outdoor image

Electrical issue image

Gemini analyzes image context and merges with user prompt.

---

### Autonomous Demo Mode

Hackathon mode allows complete automation:

```text
Request

↓

Assignment

↓

Accept

↓

Travel

↓

Arrival

↓

Working

↓

Completed
```

No technician interaction required during demo flow.

---

# 🗄 Database Architecture

Supabase Tables:

```text
profiles

providers

requests

bookings

traces

orchestration_sessions

demo_logs
```

---

## Booking Lifecycle

```text
assigned

↓

accepted

↓

en_route

↓

arrived

↓

working

↓

completed
```

---

# 🛰 Tracking System

Tracking engine supports:

- ETA
- Route progress
- Live coordinates
- Travel simulation
- Technician status
- Completion updates

Movement fields:

```sql
current_lat

current_lng

route_progress

eta_minutes
```

---

# 🧩 Tech Stack

Frontend:

- Next.js 16
- React
- TypeScript
- TailwindCSS

Backend:

- Supabase
- PostgreSQL
- Realtime DB

AI:

- Gemini API

Mobile:

- Capacitor
- Android Studio

Maps:

- Leaflet
- OpenStreetMap
- Nominatim
- OSRM

---

# 📂 Project Structure

```bash
src/

app/
 ├── home
 ├── request
 ├── tracking
 ├── orchestration
 ├── profile

 └── technician/
      ├── home
      ├── jobs
      ├── activity
      ├── earnings
      └── profile

lib/
 ├── agents
 ├── services
 ├── stores
 └── utils
```

---

# ⚙ Installation

Clone repository:

```bash
git clone <repo-url>

cd AetherFlow
```

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

TypeScript verification:

```bash
npx tsc --noEmit
```

---

# 📱 APK Build

Sync Capacitor:

```bash
npx cap sync android
```

Copy assets:

```bash
npx cap copy android
```

Open Android Studio:

```bash
npx cap open android
```

Build APK:

```text
Build

↓

Generate Signed Bundle / APK

↓

APK
```

---

# 🔐 Environment Variables

Create:

`.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_GEMINI_API_KEY=
```

---

# 📊 Observability

AI execution is observable through:

```text
INTENT_AGENT

LOCATION_AGENT

PROVIDER_AGENT

RANKING_AGENT

BOOKING_AGENT

ASSIGNMENT_AGENT

TRACE_AGENT
```

All steps are persisted in:

```text
traces
```

---

# 🧪 Testing Flow

Resident:

```text
Create Request

↓

AI Flow

↓

Assignment

↓

Tracking

↓

Complete
```

Technician:

```text
View Job

↓

Accept

↓

Travel

↓

Arrive

↓

Work

↓

Complete
```

---

# 🏁 Submission Build Status

✅ Resident App

✅ Technician App

✅ AI Pipeline

✅ Tracking Engine

✅ Multimodal Input

✅ APK Support

✅ Demo Mode

---

# 🤖 Why Agents?

Traditional applications require users to navigate complex UIs to book services. By leveraging **Agentic AI**, AetherFlow shifts the paradigm from "user-driven UI" to "intent-driven orchestration." Agents autonomously handle natural language ambiguities, extract constraints, find the best match, and execute the entire booking lifecycle—reducing friction and increasing accessibility for the informal economy.

---

# 🚀 Why Antigravity?

The **Antigravity IDE** was instrumental in accelerating the development of AetherFlow. By providing an agentic coding environment, Antigravity enabled rapid scaffolding of the Next.js frontend, generation of complex Supabase SQL schemas, and real-time debugging of the agent orchestration pipeline. Its ability to maintain full project context allowed our team to move from concept to a feature-complete submission in record time.

---

# 🏆 Competition Alignment

AetherFlow aligns perfectly with the core themes of the **Kaggle Agentic AI Competition 2026**:
- **Real-World Impact**: Addresses a massive gap in the informal service sector.
- **Agentic Capabilities**: Demonstrates true autonomous decision-making through a multi-agent pipeline.
- **Multimodal Innovation**: Seamlessly integrates text, voice, and vision capabilities.
- **Technical Rigor**: Built on a modern, scalable stack (Next.js, Supabase, Gemini).

---

# 🏗 Architecture Summary

AetherFlow employs a modern, serverless architecture:
- **Frontend**: Responsive web app built with Next.js and TailwindCSS, containerized for mobile via Capacitor.
- **Backend**: Supabase provides PostgreSQL for relational data, Edge Functions for agent logic, and Realtime capabilities for live tracking.
- **AI Core**: The Gemini API powers the multi-agent pipeline, handling intent extraction, ranking, and multimodal analysis.

---

# 🚀 Deployment Instructions

The application is fully containerized and can be deployed to any Vercel or Node.js environment.
1. Clone the repository.
2. Link your Supabase project and push the database schema (`supabase db push`).
3. Set your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GEMINI_API_KEY`).
4. Run `npm run build` and start the production server with `npm start`.

---

# 📦 APK Installation

1. Download the APK from the link provided at the top of this document.
2. Transfer the APK to your Android device.
3. Open the file manager, tap the APK, and select **Install**. (You may need to enable "Install from Unknown Sources").
4. Launch **AetherFlow** and explore the Resident and Technician flows.

---

# 🎥 Demo Video

A full end-to-end demonstration of the AetherFlow platform, showcasing multimodal requests, autonomous agent routing, and live tracking, is available here:
**[Insert Demo Video Link Here]**

---

# 🔮 Future Work

- **Voice-Native Agents**: Deepen integration with real-time voice APIs for seamless audio conversations.
- **Dynamic Pricing Model**: Implement an agent-driven pricing negotiation system based on current demand and provider availability.
- **Reputation Engine**: Build an automated trust score that evaluates technicians based on completion traces and feedback.

---

# 👥 Team

**Team Scaller AI**

Project:

**AetherFlow AI**

Challenge:

**AI Service Orchestrator for Informal Economy**

---

# 📜 License

Academic / Hackathon Submission Project
