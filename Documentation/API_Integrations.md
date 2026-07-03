# 🔌 AetherFlow AI — API Integrations Specification

*Last Updated: 2026-07-02*


**Version:** 2.0 Final | **Team:** Team Scaller AI  
**Challenge:** Challenge 2: AI Service Orchestrator for Informal Economy  

---

## 1. External Services Directory

AetherFlow AI coordinates four main external service APIs to execute geocoding, multimodal asset analysis, real-time routing, and state syncing:

| API Provider | Purpose | Endpoint Base | Authentication |
|---|---|---|---|
| **Google Gemini AI** | Intent Analysis & Visual Inspection | `https://generativelanguage.googleapis.com` | API Key (Header) |
| **OSM Nominatim** | Address Geocoding | `https://nominatim.openstreetmap.org` | User-Agent Header (Strict Rate Limits) |
| **Project OSRM** | Road Network Routing & ETAs | `https://router.project-osrm.org` | None (Public API) |
| **Supabase Client** | Database Storage & Real-Time Sync | `https://[id].supabase.co` | RLS JWT / Service Key |

---

## 2. External API Endpoints & Payloads

### 2.1 Google Gemini 2.5 Flash API
Used by `IntentAgent` and `VisionAgent` for zero-shot text classification and multimodal visual diagnostics.

* **Endpoint:** `/v1beta/models/gemini-2.5-flash:generateContent`
* **Method:** `POST`
* **Headers:** 
  ```http
  Content-Type: application/json
  x-goog-api-key: [NEXT_PUBLIC_GEMINI_API_KEY]
  ```
* **Payload Structure:**
  ```json
  {
    "contents": [
      {
        "parts": [
          { "text": "Analyze the user request and map parameters..." },
          {
            "inlineData": {
              "mimeType": "image/webp",
              "data": "/9j/4AAQSkZJRgABAQEASABIAAD..."
            }
          }
        ]
      }
    ],
    "generationConfig": {
      "responseMimeType": "application/json",
      "responseSchema": {
        "type": "OBJECT",
        "properties": {
          "service": { "type": "STRING" },
          "location": { "type": "STRING" },
          "priority": { "type": "STRING" },
          "reasoning": { "type": "STRING" },
          "full_address": { "type": "STRING" }
        },
        "required": ["service", "location", "priority", "reasoning", "full_address"]
      }
    }
  }
  ```

---

### 2.2 OpenStreetMap Nominatim (Geocoding API)
Used by `LocationAgent` to convert unstructured location text into physical latitude and longitude coordinates.

* **Endpoint:** `/search`
* **Method:** `GET`
* **URL Parameters:**
  * `q`: Clean address string (e.g. `"Gulberg, Lahore, Pakistan"`)
  * `format`: `"json"`
  * `addressdetails`: `1`
  * `limit`: `1`
* **Response Payload (OSM Standard):**
  ```json
  [
    {
      "place_id": 284729103,
      "licence": "Data © OpenStreetMap contributors...",
      "osm_type": "relation",
      "lat": "31.5204",
      "lon": "74.3587",
      "display_name": "Gulberg, Lahore, Punjab, 54660, Pakistan",
      "address": {
        "suburb": "Gulberg",
        "city": "Lahore",
        "state": "Punjab",
        "country": "Pakistan",
        "country_code": "pk"
      }
    }
  ]
  ```

---

### 2.3 Project OSRM (Routing API)
Used by `BookingService` to calculate actual road-network driving coordinates between the technician's starting position and the resident's home.

* **Endpoint:** `/route/v1/driving/{start_lng},{start_lat};{end_lng},{end_lat}`
* **Method:** `GET`
* **URL Parameters:**
  * `overview`: `"full"`
  * `geometries`: `"geojson"`
  * `steps`: `false`
* **Response Payload:**
  ```json
  {
    "code": "Ok",
    "routes": [
      {
        "geometry": {
          "coordinates": [
            [74.3587, 31.5204],
            [74.3591, 31.5211],
            [74.3602, 31.5230]
          ],
          "type": "LineString"
        },
        "legs": [
          {
            "summary": "Sherpao Bridge",
            "weight": 420.5,
            "duration": 420.5,
            "distance": 2350.0
          }
        ],
        "weight_name": "routability",
        "weight": 420.5,
        "duration": 420.5,
        "distance": 2350.0
      }
    ],
    "waypoints": [...]
  }
  ```

---

## 3. Internal Next.js API Routes

AetherFlow contains key Next.js API router scripts designed for mobile-first Capacitor wrappers:

### 3.1 Orchestrator Trigger API
Triggers the multi-agent pipeline sequentially, wrapping Intent, Location, Provider matching, and Bookings into a single transaction.

* **Endpoint:** `/api/orchestrator`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "requestId": "2b6bfa9e-473d-4c31-9f93-85f98a28795b",
    "rawInput": "AC is leaking water in Pak Arab F1 Block, Lahore.",
    "imageUrl": "https://[id].supabase.co/storage/v1/object/public/images/leak.webp"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "requestId": "2b6bfa9e-473d-4c31-9f93-85f98a28795b",
    "bookingId": "8f8bfa9e-523d-4c31-9f93-85f98a28796c",
    "stage": "COMPLETED",
    "status": "ORCHESTRATION_SUCCESS",
    "trace": "Booking finalized and assigned to Plumber Hanzala."
  }
  ```

### 3.2 Technician Travel Telemetry API
Pushes live coordinates of the technician to database subscriptions.

* **Endpoint:** `/api/bookings`
* **Method:** `PATCH`
* **Request Body:**
  ```json
  {
    "bookingId": "8f8bfa9e-523d-4c31-9f93-85f98a28796c",
    "status": "en_route",
    "providerLat": 31.5230,
    "providerLng": 74.3602,
    "etaMinutes": 5
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "status": "en_route",
    "updatedCoordinates": {
      "lat": 31.523,
      "lng": 74.3602
    }
  }
  ```

---

## 4. API Resilience & Offline Mocking Rules

To ensure AetherFlow AI passes all live QA checks even under weak internet connections or API outages:

1. **Deduplication Gates:** 
   If a client requests a resource while a stage is already working, the server blocks re-execution by reading the current `orchestration_sessions` table state.
2. **OSM Nominatim Fallback Mocks:**
   If OSM Nominatim is timed out (3s threshold) or blocked, the agent reads a local catalog matching common sectors (e.g., `"Pak Arab"` ➔ `[31.4697, 74.3732]`, `"Gulberg"` ➔ `[31.5204, 74.3587]`).
3. **OSRM Routing Fallback Mocks:**
   If Project OSRM fails to return waypoints, the `BookingService` triggers a geodetic line interpolation calculation between the technician and user coordinates, dividing the distance into 20 safe, logical increments. This allows the Leaflet map marker to move smoothly across the screen without interrupting the user experience.

---

> **AetherFlow's resilient API ecosystem guarantees a robust and uninterrupted service delivery flow, wrapping complex external geocoding and routing pipelines with fail-safe local fallback layers.**
