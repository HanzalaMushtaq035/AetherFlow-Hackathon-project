import { createBrowserClient } from "@supabase/ssr";
import { Trace } from "@/types/database";

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class TraceService {
    // Save agent execution trace
    async create(
        requestId: string,
        agent: string,
        action: string,
        reasoning?: string,
        severity: 'INFO' | 'WARNING' | 'ERROR' | 'ACTION' = 'INFO',
        reason?: string
    ): Promise<Trace> {
        if (!requestId) {
            throw new Error("Cannot create trace: requestId is empty");
        }

        const agentNorm = (agent || "").toUpperCase();
        const actNorm = (action || "").toUpperCase();

        // 1. 60-second dedup lock for NARRATOR_AGENT, TECHNICIAN_AGENT, RANKING_AGENT (TASK 4)
        const dedupAgentsList = ["NARRATOR_AGENT", "TECHNICIAN_AGENT", "RANKING_AGENT"];
        if (dedupAgentsList.includes(agentNorm)) {
            const cutoffTime = new Date(Date.now() - 60000).toISOString();
            const { data: recentLogs } = await supabase
                .from("traces")
                .select("*")
                .eq("request_id", requestId)
                .eq("agent", agent)
                .gte("created_at", cutoffTime);

            if (recentLogs && recentLogs.length > 0) {
                const duplicate = recentLogs.find((t: any) => {
                    let logAction = t.action || "";
                    if (logAction.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(logAction);
                            logAction = parsed.action || logAction;
                        } catch (e) {}
                    }
                    return logAction.toLowerCase() === action.toLowerCase();
                });

                if (duplicate) {
                    console.log(`[TraceService] Duplicate trace ignored for ${agent} - ${action} within 60s`);
                    return duplicate as Trace;
                }
            }
        }

        // 2. Travel Transit Rate Limit (Max 1 log every 30 sec)
        if (actNorm.includes("TECHNICIAN_EN_ROUTE") || actNorm.includes("TRAVEL") || actNorm.includes("TRANSIT")) {
            const { data: recentEnRoute } = await supabase
                .from("traces")
                .select("*")
                .eq("request_id", requestId)
                .eq("agent", "TECHNICIAN_AGENT")
                .like("action", "%TECHNICIAN_EN_ROUTE%")
                .order("created_at", { ascending: false })
                .limit(1);

            if (recentEnRoute && recentEnRoute.length > 0) {
                const lastTime = new Date(recentEnRoute[0].created_at).getTime();
                const now = Date.now();
                if (now - lastTime < 30000) {
                    return recentEnRoute[0] as Trace;
                }
            }
        }

        // 3. General dedup check to prevent duplicate agent traces per stage/action
        const dedupAgents = [
            'PROVIDER_AGENT', 'RANKING_AGENT', 'BOOKING_AGENT', 'ASSIGNMENT_AGENT',
            'ProviderAgent', 'RankingAgent', 'BookingAgent', 'AssignmentAgent',
            'Provider Agent', 'Ranking Agent', 'Booking Agent', 'Assignment Agent'
        ];
        const isDedupAgent = dedupAgents.includes(agent);

        let query = supabase
            .from("traces")
            .select("*")
            .eq("request_id", requestId)
            .eq("agent", agent);

        if (!isDedupAgent) {
            query = query.like("action", `%${action}%`);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
            return existing as Trace;
        }

        // Serialize severity, action, reason inside action column
        const payload = JSON.stringify({
            action,
            severity,
            reason: reason || reasoning || "Autonomous protocol verified."
        });

        const { data, error } = await supabase
            .from("traces")
            .insert({
                request_id: requestId,
                agent,
                action: payload,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Trace create failed:", error);
            throw error;
        }
        return data as Trace;
    }

    // Get request timeline
    async getByRequest(
        requestId: string
    ): Promise<any[]> {
        if (!requestId) return [];

        try {
            const { data, error } = await supabase
                .from("traces")
                .select("*")
                .eq("request_id", requestId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            return (data || []).map((t: any) => {
                let parsedAction = t.action;
                let severity = 'INFO';
                let reason = '';

                try {
                    if (t.action && t.action.trim().startsWith('{')) {
                        const parsed = JSON.parse(t.action);
                        parsedAction = parsed.action || t.action;
                        severity = parsed.severity || 'INFO';
                        reason = parsed.reason || '';
                    }
                } catch (e) {
                    // Fallback to legacy parsing if not JSON
                    if (t.action.toLowerCase().includes("failed") || t.action.toLowerCase().includes("error")) {
                        severity = 'ERROR';
                    } else if (t.action.toLowerCase().includes("alert") || t.action.toLowerCase().includes("warning")) {
                        severity = 'WARNING';
                    }
                }

                return {
                    ...t,
                    parsedAction,
                    severity,
                    reason
                };
            });
        } catch (err) {
            console.error("Supabase Trace getByRequest failed:", err);
            return [];
        }
    }

    // Activity page data
    async getUserActivity(
        userId: string
    ) {
        if (!userId) return [];

        try {
            const { data, error } = await supabase
                .from("traces")
                .select(`
                    *,
                    requests!inner(
                        user_id
                    )
                `)
                .eq("requests.user_id", userId);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error("Supabase getUserActivity failed:", err);
            return [];
        }
    }

    // Log agent automatically
    async logAgent(
        requestId: string,
        agent: string,
        step: string
    ) {
        return this.create(
            requestId,
            agent,
            step
        );
    }
}

export default new TraceService();