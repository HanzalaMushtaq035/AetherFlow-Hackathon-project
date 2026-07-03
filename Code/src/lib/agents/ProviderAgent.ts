import { RequestService } from "../services/RequestService";

// In-memory cache for provider searches to satisfy Phase 10 API Speed Boost
const providerSearchCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes TTL

export class ProviderAgent {
    async execute(
        requestId: string,
        service: string,
        location: string
    ) {
        // Strict 5-second timeout on Provider Discovery
        return Promise.race([
            this.discoverProviders(requestId, service, location),
            new Promise<any[]>((resolve) => setTimeout(async () => {
                console.warn("ProviderAgent timed out after 5000ms. Falling back.");
                const providers = await RequestService.findMatchingProviders(service, location);
                resolve(providers);
            }, 5000))
        ]);
    }

    private async discoverProviders(
        requestId: string,
        service: string,
        location: string
    ) {
        const cacheKey = `${service.toLowerCase()}_${location.toLowerCase()}`;
        const cached = providerSearchCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[ProviderAgent] Returning cached results for key: ${cacheKey}`);
            try {
                await RequestService.logTrace(
                    requestId,
                    "PROVIDER_AGENT",
                    `[Cache Hit] ${cached.data.length} providers resolved`
                );
            } catch (e) {}
            return cached.data;
        }

        const providers = await RequestService.findMatchingProviders(
            service,
            location
        );

        try {
            await RequestService.logTrace(
                requestId,
                "PROVIDER_AGENT",
                `${providers.length} providers found`
            );
        } catch (err) {
            console.error("ProviderAgent trace logging failed:", err);
        }

        // Cache the newly resolved providers list
        providerSearchCache.set(cacheKey, { data: providers, timestamp: Date.now() });

        return providers;
    }

    validate() {
        return true;
    }

    log() {
        console.log("ProviderAgent executed");
    }
}

const instance = new ProviderAgent();
export default instance;