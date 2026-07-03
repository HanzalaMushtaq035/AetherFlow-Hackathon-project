"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Send, ArrowLeft, Loader2, Camera, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { RequestService } from "@/lib/services/RequestService";
import { IntentAgent } from "@/lib/agents/intent";
import Link from "next/link";

export default function RequestPage() {
  const router = useRouter();
  const { requestText, setRequestText, extractedData, setExtractedData, setWorkflowStatus, setCurrentRequestId } = useStore();
  const { user } = useAuthStore();
  const [isParsing, setIsParsing] = useState(false);
  const [dbError, setDbError] = useState("");
  
  // Multimodal state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [visionMode, setVisionMode] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"en-PK" | "en-US" | "ur-PK">("en-PK");

  // Scheduling state
  const [isScheduledManual, setIsScheduledManual] = useState(false);
  const [manualDate, setManualDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [manualTime, setManualTime] = useState("12:00");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const serviceParam = params.get("service");
      if (serviceParam) {
        setRequestText(`I need a ${serviceParam} in G-10.`);
      }
    }
  }, [setRequestText]);

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
      }
    }
  }, []);

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageMimeType(file.type || "image/jpeg");
    
    // Preview
    const previewReader = new FileReader();
    previewReader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
    };
    previewReader.readAsDataURL(file);
    
    // Base64 for API
    const base64Reader = new FileReader();
    base64Reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      setImageBase64(base64);
      setVisionMode(true);
    };
    base64Reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImageBase64(null);
    setVisionMode(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Voice input handler
  const toggleVoice = async () => {
    if (!voiceSupported) {
      setDbError("Voice input not supported in this browser. Please type your request manually.");
      return;
    }

    if (isListening) {
      console.log("[RequestPage] Stopping speech recognition.");
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      console.log("[RequestPage] Requesting microphone access...");
      // Check microphone permissions explicitly
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Release microphone stream immediately since SpeechRecognition will capture it
          stream.getTracks().forEach(track => track.stop());
          console.log("[RequestPage] Microphone permission granted.");
        } catch (permErr: any) {
          console.error("[RequestPage] Microphone access denied:", permErr);
          setDbError("Microphone permission denied. Please allow access in browser settings.");
          return;
        }
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;

      // Dynamic speech recognition language strategy
      recognition.lang = voiceLang; 

      recognition.onstart = () => {
        console.log(`[RequestPage] Speech recognition session started. Selected language: ${voiceLang}`);
        setIsListening(true);
        setDbError("");
      };
      
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        console.log(`[RequestPage] Speech result detected: "${transcript}" (Language: ${voiceLang})`);
        setRequestText(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error(`[RequestPage] Speech recognition error: ${event.error} (Language: ${voiceLang})`);
        if (event.error === "not-allowed") {
          setDbError("Microphone permission denied. Please allow microphone access.");
        } else if (event.error === "no-speech") {
          setDbError("No speech detected. Please speak clearly or write your request manually.");
        } else {
          setDbError(`Voice recognition issue: ${event.error}. Please type manually.`);
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log("[RequestPage] Speech recognition session ended.");
        setIsListening(false);
      };
      
      recognition.start();
    } catch (err: any) {
      console.error("[RequestPage] Voice init failed:", err);
      setDbError("Voice input initialization failed. Please write your request manually.");
      setIsListening(false);
    }
  };

  // Process with standard IntentAgent or Vision analysis
  const handleProcess = async () => {
    if (!user) {
      setDbError("Please login to create a request.");
      return;
    }
    
    if (!requestText && !uploadedImage) {
      setDbError("Please enter a request or upload an image.");
      return;
    }
    
    setIsParsing(true);
    setDbError("");
    
    try {
      let extracted: any;
      let isImageAnalysisFailed = false;

      let visionResult: any = null;
      if (uploadedImage && imageBase64) {
        // MIME Validation and Security boundaries
        const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validMimeTypes.includes(imageMimeType)) {
          throw new Error("Invalid image format. Supported formats are JPEG, PNG, WEBP, and GIF.");
        }

        // Limit check: 5MB size limit (approx 6.7MB in base64 format)
        const approxSizeBytes = (imageBase64.length * 3) / 4;
        if (approxSizeBytes > 5 * 1024 * 1024) {
          throw new Error("Image exceeds maximum allowed size of 5MB.");
        }

        try {
          console.log("[RequestPage] Performing Gemini Vision analysis with VisionAgent...");
          // Dynamic import of the new VisionAgent to keep it clean and isolated
          const { default: VisionAgent } = await import("@/lib/agents/VisionAgent");

          visionResult = await VisionAgent.execute(imageBase64, imageMimeType);
          
          if (visionResult && visionResult.category) {
            // Map parsed category code to human-readable service categories for IntentAgent
            let mappedService = "Handyman";
            if (visionResult.category === "plumber") mappedService = "Plumber";
            else if (visionResult.category === "electrician") mappedService = "Electrician";
            else if (visionResult.category === "ac_technician") mappedService = "AC Technician";
            
            // Build structured text prompt to send into the existing IntentExtractor flow
            const generatedQuery = `Need ${mappedService} for ${visionResult.problem || "maintenance issue"}: ${visionResult.description || ""}. ${requestText || ""}`.trim();
            console.log("[RequestPage] Sending generated query to IntentAgent:", generatedQuery);

            extracted = await IntentAgent.extract(generatedQuery);
            
            // Override urgency with specific vision urgency if set
            if (visionResult.urgency) {
              extracted.priority = visionResult.urgency;
            }
          } else {
            throw new Error("Invalid vision extraction payload.");
          }
        } catch (visionErr: any) {
          console.error("[RequestPage] Vision analysis failed, falling back to linguistic extraction:", visionErr);
          isImageAnalysisFailed = true;
          
          // Generate fallback intent
          if (requestText) {
            extracted = await IntentAgent.extract(requestText);
          } else {
            extracted = {
              service: "AC Repair", // AC is the fallback default for photo-only AC units
              location: "G10",
              time: "Now",
              priority: "medium",
              reasoning: "Photo uploaded. Linguistic parser used defaults due to vision timeout."
            };
          }
          extracted.reasoning = `${extracted.reasoning || ""} [Image analysis fallback active]`;
        }
      } else {
        // Standard text-only IntentAgent
        extracted = await IntentAgent.extract(requestText);
      }
      
      let reasoningPayload = extracted.reasoning || "";
      const metadataPayload = {
        reasoning: extracted.reasoning || "Diagnostic details successfully resolved.",
        image_url: uploadedImage || null,
        image_analysis: visionResult || null,
        image_analysis_failed: isImageAnalysisFailed
      };
      reasoningPayload = JSON.stringify(metadataPayload);

      let resolvedIsScheduled = isScheduledManual || !!extracted.is_scheduled;
      let resolvedStartTime = null;
      let resolvedEndTime = null;
      let resolvedRequestedTime = extracted.time || "Now";

      if (isScheduledManual && manualDate && manualTime) {
        const start = new Date(`${manualDate}T${manualTime}`);
        if (!isNaN(start.getTime())) {
          resolvedStartTime = start.toISOString();
          resolvedEndTime = new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString();
          
          const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
          const dateStr = start.toLocaleDateString(undefined, options);
          const timeStr = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
          resolvedRequestedTime = `${dateStr} at ${timeStr}`;
        }
      } else if (extracted.is_scheduled && extracted.preferred_start_time) {
        resolvedStartTime = extracted.preferred_start_time;
        resolvedEndTime = extracted.preferred_end_time;
        resolvedRequestedTime = extracted.time;
      }

      const newReq = await RequestService.createRequest({
        user_id: user.id,
        raw_input: requestText || "[Image Upload]",
        service: extracted.service,
        location: extracted.location,
        requested_time: resolvedRequestedTime,
        priority: extracted.priority,
        reasoning: reasoningPayload,
        preferred_start_time: resolvedStartTime,
        preferred_end_time: resolvedEndTime,
        is_scheduled: resolvedIsScheduled
      });
      
      setCurrentRequestId(newReq.id);
      setExtractedData({
        service: extracted.service,
        location: extracted.location,
        time: resolvedRequestedTime,
        priority: extracted.priority
      });
      
      // Auto-continue flow to orchestration
      setWorkflowStatus("ORCHESTRATING");
      router.push("/orchestration");
    } catch (err: any) {
      setDbError(err.message || "Failed to parse or save request.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = () => {
    setWorkflowStatus("ORCHESTRATING");
    router.push("/orchestration");
  };

  const hasInput = !!(requestText || imageBase64);

  return (
    <div className="pt-16 pb-28 px-4 min-h-screen bg-[#050505]">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/home">
          <div className="p-2 rounded-xl bg-surface-container hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
          </div>
        </Link>
        <h1 className="text-lg font-bold text-white tracking-tight">New Protocol</h1>
      </div>

      <section className="space-y-6">
        {/* Language Selection Pills */}
        <div className="flex gap-2 mb-2 justify-end">
          {[
            { code: "en-PK", label: "Mixed / Auto (en-PK)" },
            { code: "en-US", label: "English (en-US)" },
            { code: "ur-PK", label: "Urdu (ur-PK)" }
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setVoiceLang(lang.code as any)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[9px] font-mono tracking-wider transition-all",
                voiceLang === lang.code
                  ? "bg-primary/20 text-primary border border-primary/30 font-bold"
                  : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="relative">
          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="What should I orchestrate? (English or Urdu)"
            className="w-full bg-[#111] border border-white/5 rounded-2xl p-5 min-h-[120px] text-base text-white placeholder:text-on-surface-variant/20 focus:outline-none focus:border-primary/20 transition-all resize-none shadow-inner"
          />
          {dbError && (
            <div className="absolute top-2 right-2 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded max-w-[200px]">
              {dbError}
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex gap-2">
            {/* Voice button */}
            <button 
              onClick={toggleVoice}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                isListening 
                  ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" 
                  : "bg-white/5 text-on-surface-variant hover:bg-white/10"
              )}
              title={voiceSupported ? (isListening ? "Stop listening" : "Start voice input") : "Voice not supported"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            {/* Send button */}
            <button 
              onClick={handleProcess}
              disabled={!hasInput || isParsing}
              className="p-2.5 rounded-xl bg-primary text-black disabled:opacity-30 shadow-lg shadow-primary/20"
            >
              {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Image Upload Area */}
        <div className="space-y-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            capture="environment"
            onChange={handleImageUpload}
            className="hidden" 
          />
          
          {!uploadedImage ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-2xl border border-dashed border-white/10 bg-[#111]/50 flex items-center justify-center gap-3 hover:border-primary/20 hover:bg-primary/[0.02] transition-all group"
            >
              <div className="p-2 rounded-xl bg-white/5 group-hover:bg-primary/10 transition-colors">
                <Camera className="w-5 h-5 text-on-surface-variant/40 group-hover:text-primary-fixed-dim transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/60 font-medium">Attach Photo</p>
                <p className="text-[9px] text-on-surface-variant/30 font-mono uppercase tracking-wider">Photo uploaded for technician reference</p>
              </div>
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#111]"
            >
              <img 
                src={uploadedImage} 
                alt="Uploaded" 
                className="w-full h-48 object-cover opacity-90" 
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/80 hover:bg-red-500/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Scheduling Selection UI */}
        <div className="space-y-3 p-4 rounded-2xl border border-white/5 bg-[#111]/30">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-white/65 font-medium font-mono uppercase tracking-wider">Protocol Schedule</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsScheduledManual(false)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-mono tracking-wider transition-all",
                  !isScheduledManual
                    ? "bg-primary/20 text-primary border border-primary/30 font-bold"
                    : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
                )}
              >
                ASAP (Immediate)
              </button>
              <button
                type="button"
                onClick={() => setIsScheduledManual(true)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-mono tracking-wider transition-all",
                  isScheduledManual
                    ? "bg-primary/20 text-primary border border-primary/30 font-bold"
                    : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
                )}
              >
                Schedule Appointment
              </button>
            </div>
          </div>

          {isScheduledManual && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[9px] text-white/40 font-mono uppercase mb-1">Target Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/20 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] text-white/40 font-mono uppercase mb-1">Target Time</label>
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full bg-[#111] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/20 font-mono"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Voice indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                </div>
                <span className="text-[10px] text-red-400 font-mono uppercase tracking-widest">
                  Listening... speak now (EN / UR)
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Modality Indicators */}
      <div className="mt-8 flex justify-center gap-4 opacity-30">
        <span className={cn("text-[9px] font-label-mono pb-1 transition-colors", requestText ? "border-b border-primary text-primary opacity-100" : "")}>TEXT</span>
        <span className={cn("text-[9px] font-label-mono pb-1 transition-colors", uploadedImage ? "border-b border-primary text-primary opacity-100" : "")}>IMAGE</span>
        <span className={cn("text-[9px] font-label-mono pb-1 transition-colors", isListening ? "border-b border-red-400 text-red-400 opacity-100" : "")}>VOICE</span>
      </div>
    </div>
  );
}
