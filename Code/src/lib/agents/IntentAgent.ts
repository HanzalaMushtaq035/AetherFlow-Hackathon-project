import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

const extractionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    service: {
      type: SchemaType.STRING,
      description: "The type of service requested. Must be normalized and capitalized, e.g., 'AC Technician', 'Plumber', 'Electrician', 'Carpenter', 'Bike Mechanic'.",
    },
    location: {
      type: SchemaType.STRING,
      description: "The specific location for the service to be delivered, e.g. G10, F11, Gulberg, G13.",
    },
    requested_time: {
      type: SchemaType.STRING,
      description: "The requested time or schedule for the service, e.g., 'Tomorrow Morning', 'Now', 'Today', 'Tomorrow'.",
    },
    priority: {
      type: SchemaType.STRING,
      description: "The urgency of the request. Must be one of: 'low', 'medium', 'high', 'urgent'.",
    },
    reasoning: {
      type: SchemaType.STRING,
      description: "A brief reason explaining how the parameters were extracted.",
    },
    preferred_start_time: {
      type: SchemaType.STRING,
      description: "The ISO formatted start timestamp of the schedule, if applicable.",
    },
    preferred_end_time: {
      type: SchemaType.STRING,
      description: "The ISO formatted end timestamp of the schedule, if applicable.",
    },
    is_scheduled: {
      type: SchemaType.BOOLEAN,
      description: "True if the request is scheduled for a specific time or time slot in the future, false if ASAP.",
    }
  },
  required: ["service", "location", "requested_time", "priority", "reasoning", "preferred_start_time", "preferred_end_time", "is_scheduled"],
};

export class IntentAgentClass {
  // Advanced dynamic fallback parser for multilingual input
  private stopWords = new Set([
    "i", "want", "need", "require", "mujhe", "chahiye", "chahye", "chahia", 
    "hai", "ko", "aik", "ek", "a", "an", "the", "near", "in", "at", "for", 
    "please", "zaroorat", "zarurat", "ki", "ka", "karein", "karna", "do"
  ]);

  private knownServices = [
    "bike mechanic", "ac technician", "ac repair", "plumber", "electrician", "carpenter", 
    "mechanic", "cleaner", "tutor", "beautician", "mason", "driver", 
    "gardener", "painter", "tailor", "appliance maintenance"
  ];

  dynamicExtract(text: string) {
    // 1. Normalize
    let normalized = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\n]/g, " ").replace(/\s+/g, " ").trim();
    let queryForService = normalized;

    // 2. Extract time entity first
    let requested_time: string | null = null;
    let is_scheduled = false;
    let preferred_start_time: string | null = null;
    let preferred_end_time: string | null = null;

    const relativeDates = [
      { name: "day after tomorrow", offset: 2, urdu: "parso" },
      { name: "tomorrow", offset: 1, urdu: "kal" },
      { name: "today", offset: 0, urdu: "aaj" }
    ];

    const dayOfWeekNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const nowUtc = new Date();
    // Represent current PKT time (UTC+5) inside a Date object using UTC offset shifting
    let targetDate = new Date(nowUtc.getTime() + 5 * 60 * 60 * 1000);
    let dateFound = false;
    let matchedDatePhrase = "";

    for (let i = 0; i < 7; i++) {
      const day = dayOfWeekNames[i];
      const nextDayRegex = new RegExp(`\\b(next\\s+)?${day}\\b`, "i");
      const match = queryForService.match(nextDayRegex);
      if (match) {
        const currentDay = targetDate.getUTCDay();
        let diff = i - currentDay;
        if (diff <= 0) {
          diff += 7; // next week
        }
        if (match[1]) {
          if (i - currentDay > 0) {
            diff += 7;
          }
        }
        targetDate.setUTCDate(targetDate.getUTCDate() + diff);
        dateFound = true;
        is_scheduled = true;
        matchedDatePhrase = match[0];
        break;
      }
    }

    if (!dateFound) {
      for (const rd of relativeDates) {
        if (queryForService.includes(rd.name) || queryForService.includes(rd.urdu)) {
          targetDate.setUTCDate(targetDate.getUTCDate() + rd.offset);
          dateFound = true;
          is_scheduled = true;
          matchedDatePhrase = queryForService.includes(rd.name) ? rd.name : rd.urdu;
          break;
        }
      }
    }

    let hour = 9;
    let minute = 0;
    let matchedTimePhrase = "";
    
    const timeRegex = /\b(?:after\s+)?(\d{1,2})(?::(\d{2}))?\s*(pm|am)\b/i;
    const timeMatch = queryForService.match(timeRegex);
    if (timeMatch) {
      is_scheduled = true;
      let parsedHour = parseInt(timeMatch[1], 10);
      const isPm = timeMatch[3].toLowerCase() === "pm";
      if (isPm && parsedHour < 12) parsedHour += 12;
      if (!isPm && parsedHour === 12) parsedHour = 0;
      hour = parsedHour;
      if (timeMatch[2]) {
        minute = parseInt(timeMatch[2], 10);
      }
      matchedTimePhrase = timeMatch[0];
    } else {
      const periods = [
        { name: "morning", hour: 9, urdu: "subah" },
        { name: "afternoon", hour: 14, urdu: "dopahar" },
        { name: "evening", hour: 17, urdu: "shaam" },
        { name: "night", hour: 21, urdu: "raat" }
      ];
      for (const p of periods) {
        if (queryForService.includes(p.name) || queryForService.includes(p.urdu)) {
          is_scheduled = true;
          hour = p.hour;
          matchedTimePhrase = queryForService.includes(p.name) ? p.name : p.urdu;
          break;
        }
      }
    }

    if (is_scheduled) {
      const formatLocalISO = (d: Date, hr: number, min: number, sec = 0) => {
        const year = d.getUTCFullYear();
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = d.getUTCDate().toString().padStart(2, '0');
        const hourStr = hr.toString().padStart(2, '0');
        const minStr = min.toString().padStart(2, '0');
        const secStr = sec.toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hourStr}:${minStr}:${secStr}+05:00`;
      };

      preferred_start_time = formatLocalISO(targetDate, hour, minute);

      if (queryForService.includes("midnight") || queryForService.includes("aadha raat")) {
        preferred_end_time = formatLocalISO(targetDate, 23, 59, 59);
        if (!matchedTimePhrase.toLowerCase().includes("midnight")) {
          queryForService = queryForService.replace(/\b(midnight|aadha raat)\b/g, "");
        }
      } else {
        let endHour = hour + 2;
        let endDayDate = new Date(targetDate.getTime());
        if (endHour >= 24) {
          endHour = endHour % 24;
          endDayDate.setUTCDate(endDayDate.getUTCDate() + 1);
        }
        preferred_end_time = formatLocalISO(endDayDate, endHour, minute);
      }

      if (matchedDatePhrase) {
        queryForService = queryForService.replace(new RegExp(`\\b${matchedDatePhrase}\\b`, "i"), "");
      }
      if (matchedTimePhrase) {
        queryForService = queryForService.replace(new RegExp(`\\b${matchedTimePhrase}\\b`, "i"), "");
      }
      queryForService = queryForService.replace(/\b(at|after|on|in)\s*$/gi, "");

      let dateLabel = "Scheduled";
      if (matchedDatePhrase) {
        dateLabel = matchedDatePhrase.charAt(0).toUpperCase() + matchedDatePhrase.slice(1);
      }
      let timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      if (timeMatch) {
        timeLabel = `${timeMatch[1]}${timeMatch[2] ? ':' + timeMatch[2] : ''} ${timeMatch[3].toUpperCase()}`;
        if (timeMatch[0].toLowerCase().includes("after")) {
          timeLabel = "After " + timeLabel;
        }
      }
      requested_time = `${dateLabel} at ${timeLabel}`;
    } else {
      requested_time = "Now";
    }

    console.log("Detected time phrase:", is_scheduled ? `${matchedDatePhrase} ${matchedTimePhrase}`.trim() : "None (ASAP)");

    // 3. Extract location entity
    let location: string | null = null;
    const locationPrepositions = ["\\bin\\b", "\\bnear\\b", "\\bat\\b", "\\baround\\b", "\\bki taraf\\b", "\\bpar\\b"];
    const locationRegex = new RegExp(`(?:${locationPrepositions.join("|")})\\s+([a-z0-9\\s\\-]{3,})`, "i");
    const locMatch = queryForService.match(locationRegex);

    if (locMatch) {
      const fullLocPhrase = locMatch[1].trim();
      location = fullLocPhrase.split(/\s+(?:please|jaldi|urgent|fauri|need|want|chahiye|chahye)\b/i)[0].trim();
      location = location.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      queryForService = queryForService.replace(locMatch[0], "");
    } else {
      const knownLocations = [
        "j block johar town", "johar town", "phase 5 dha lahore", "dha lahore", "dha", 
        "model town lahore", "model town", "g10 islamabad", "g10", "f-11 markaz", "f11", 
        "blue area islamabad", "blue area", "g13", "f10", "gulberg"
      ];
      for (const kl of knownLocations) {
        if (queryForService.includes(kl)) {
          location = kl.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          queryForService = queryForService.replace(kl, "");
          break;
        }
      }
    }

    console.log("Detected location:", location);

    // 4. Extract Problem Entity
    let problem: string | null = null;
    const problemMappings = [
      { keys: ["cooling nahi kar raha", "cooling nahi", "garm hai room", "cooling issue", "not cooling", "ac thanda nahi"], value: "AC not cooling" },
      { keys: ["leakage", "leak", "pani leak", "leakage under sink", "nalka tapak raha"], value: "pipe leakage" },
      { keys: ["sparking", "spark", "short circuit", "dhuan", "smoke"], value: "electrical sparking" },
      { keys: ["wiring issue", "socket issue", "button kharab"], value: "electrical socket issue" },
      { keys: ["repair wall", "wall minor repair", "darwaza kharab", "door repair"], value: "minor wall/door repair" }
    ];

    for (const mapping of problemMappings) {
      if (mapping.keys.some(k => normalized.includes(k))) {
        problem = mapping.value;
        break;
      }
    }

    let cleanedQuery = queryForService.replace(/\s+/g, " ").trim();
    console.log("Cleaned query:", cleanedQuery);

    // 5. Extract Service Entity (Semantic Classification)
    let service = "handyman";
    let confidence = 0.45;

    const categoryMappings = [
      {
        category: "ac_technician",
        keywords: ["ac", "air conditioner", "split ac", "ac repair", "ac wala", "ac technician"],
        problems: ["cooling nahi kar raha", "garm", "ac thanda", "cooling issue", "not cooling"]
      },
      {
        category: "plumber",
        keywords: ["plumber", "pipe", "nalka", "washroom", "bathroom", "leak", "leakage", "blockage", "drain", "sink"],
        problems: ["pani leak", "tap leakage"]
      },
      {
        category: "electrician",
        keywords: ["electrician", "bijli", "wire", "sparking", "spark", "socket", "light", "switch", "short circuit", "electricity"],
        problems: ["current", "short"]
      },
      {
        category: "handyman",
        keywords: ["handyman", "carpenter", "wall", "minor repair", "darwaza", "door", "tutor", "cleaner", "gardener", "mason"]
      }
    ];

    const hasWord = (text: string, phrase: string) => {
      const escaped = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
    };

    let bestCategory = "";

    for (const mapping of categoryMappings) {
      if (mapping.keywords.some(k => hasWord(cleanedQuery, k))) {
        bestCategory = mapping.category;
        confidence = 0.95;
        break;
      }
    }

    if (!bestCategory) {
      for (const mapping of categoryMappings) {
        if (mapping.problems && mapping.problems.some(p => normalized.includes(p))) {
          bestCategory = mapping.category;
          confidence = 0.85;
          break;
        }
      }
    }

    if (!bestCategory) {
      if (hasWord(cleanedQuery, "technician") || hasWord(cleanedQuery, "wala")) {
        bestCategory = "handyman";
        confidence = 0.45;
      } else {
        bestCategory = "handyman";
        confidence = 0.35;
      }
    }

    service = bestCategory;
    console.log("Resolved service:", service);
    console.log("Detected problem:", problem);
    console.log("Intent confidence:", confidence);

    let priority = "medium";
    if (normalized.includes("fauri") || normalized.includes("urgent") || normalized.includes("emergency") || normalized.includes("jaldi") || normalized.includes("asap")) {
      priority = "urgent";
    } else if (normalized.includes("kharab") || normalized.includes("leak") || normalized.includes("broken") || normalized.includes("short") || normalized.includes("shat")) {
      priority = "high";
    }

    return {
      service,
      location,
      problem,
      requested_time,
      preferred_start_time,
      preferred_end_time,
      is_scheduled,
      priority,
      confidence
    };
  }

  async execute(input: string) {
    console.log("[IntentAgent] Extracting intent with standard 15-second protection lock...");
    
    return Promise.race([
      (async () => {
        try {
          return this.dynamicExtract(input);
        } catch (e: any) {
          console.error("[IntentAgent] Extraction failed, returning fallback intent parameters:", e);
          return {
            service: "handyman",
            location: null,
            problem: null,
            requested_time: "Now",
            priority: "medium",
            reasoning: `Intent extractor recovery triggered. Heuristic: ${e.message}`,
            preferred_start_time: null,
            preferred_end_time: null,
            is_scheduled: false,
            confidence: 0.35
          };
        }
      })(),
      new Promise<any>((resolve) => setTimeout(() => {
        console.warn("[IntentAgent] Extractor execution timed out (15000ms limit reached). Returning baseline fallback intent.");
        resolve({
          service: "handyman",
          location: null,
          problem: null,
          requested_time: "Now",
          priority: "medium",
          reasoning: "Intent Extractor timed out safely. Baseline fallback service matched.",
          preferred_start_time: null,
          preferred_end_time: null,
          is_scheduled: false,
          confidence: 0.35
        });
      }, 15000))
    ]);
  }

  validate() {
    return true;
  }

  log() {
    console.log("IntentAgent executed");
  }
}

const instance = new IntentAgentClass();
export default instance;