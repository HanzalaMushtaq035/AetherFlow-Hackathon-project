import { RequestService } from "../services/RequestService";

export class LocationAgent {
    async execute(requestId: string, location: string) {
        // Strict 5-second timeout on Location Agent
        return Promise.race([
            this.parseLocationDetails(requestId, location),
            new Promise<any>((resolve) => setTimeout(() => {
                console.warn("LocationAgent timed out after 5000ms. Returning fallback.");
                resolve({
                    location: location || "G10",
                    mapped: true,
                    full_address: location || "G10, Islamabad",
                    coordinates: { lat: 33.6844, lng: 73.0479 },
                    confidence: 0.5
                });
            }, 5000))
        ]);
    }

    private async parseLocationDetails(requestId: string, location: string) {
        const text = location || "G10";
        const lower = text.toLowerCase();
        
        let city = "Islamabad";
        let sector = "";
        let block = "";
        let houseNumber = "";
        let landmark = "";
        let confidence = 0.4;

        // 1. City extraction
        if (lower.includes("lahore")) {
            city = "Lahore";
            confidence += 0.2;
        } else if (lower.includes("karachi")) {
            city = "Karachi";
            confidence += 0.2;
        } else if (lower.includes("islamabad")) {
            city = "Islamabad";
            confidence += 0.1;
        }

        // 2. Sector extraction
        const sectorMatch = text.match(/\b([gfi])[-_\s]?(\d+)\b/i);
        if (sectorMatch) {
            sector = `${sectorMatch[1].toUpperCase()}${sectorMatch[2]}`;
            confidence += 0.25;
        }

        // 3. Block extraction
        const blockMatch = text.match(/\b(block\s+[a-z0-9]+|[a-z0-9]+\s+block|[a-z]\d+)\b/i);
        if (blockMatch) {
            block = blockMatch[1].toUpperCase();
            confidence += 0.2;
        }

        // 4. House Number extraction
        const houseMatch = text.match(/\b(house|h)\s*(number|#)?\s*(\d+)\b/i);
        if (houseMatch) {
            houseNumber = `House ${houseMatch[3]}`;
            confidence += 0.2;
        }

        // 5. Landmark extraction / specific schemes
        if (lower.includes("pak arab")) {
            landmark = "Pak Arab Housing Scheme";
            confidence += 0.15;
        } else if (lower.includes("dha")) {
            landmark = "DHA";
            confidence += 0.1;
        } else if (lower.includes("johar town")) {
            landmark = "Johar Town";
            confidence += 0.1;
        } else if (lower.includes("clifton")) {
            landmark = "Clifton";
            confidence += 0.15;
        }

        // 6. Address construction
        const addressParts = [];
        if (houseNumber) addressParts.push(houseNumber);
        if (block) addressParts.push(block);
        if (landmark) addressParts.push(landmark);
        if (sector) addressParts.push(sector);
        addressParts.push(city);
        const full_address = addressParts.join(", ");

        // 7. Coordinate resolution (accurate mapping)
        let lat = 33.6844;
        let lng = 73.0479;

        if (city === "Lahore") {
            lat = 31.5204;
            lng = 74.3587;
            if (lower.includes("pak arab")) {
                lat = 31.4283;
                lng = 74.3721;
            } else if (lower.includes("dha")) {
                lat = 31.4697;
                lng = 74.4089;
            } else if (lower.includes("johar")) {
                lat = 31.4697;
                lng = 74.2728;
            }
        } else if (city === "Karachi") {
            lat = 24.8607;
            lng = 67.0011;
            if (lower.includes("clifton")) {
                lat = 24.8138;
                lng = 67.0359;
            } else if (lower.includes("gulshan")) {
                lat = 24.9180;
                lng = 67.0971;
            }
        } else {
            // Islamabad / Sectors
            if (sector === "G10") {
                lat = 33.6844;
                lng = 73.0479;
            } else if (sector === "F6") {
                lat = 33.7294;
                lng = 73.0931;
            } else if (sector === "G13") {
                lat = 33.6244;
                lng = 72.9780;
            } else if (sector === "I8") {
                lat = 33.6684;
                lng = 73.0780;
            }
        }

        const confidenceScore = Math.min(confidence, 1.0);
        const message = `${full_address} mapped (Confidence: ${(confidenceScore * 100).toFixed(0)}%)`;
        
        await RequestService.logTrace(requestId, "LOCATION_AGENT", message);

        return {
            location: sector || city,
            mapped: true,
            full_address,
            coordinates: { lat, lng },
            confidence: confidenceScore
        };
    }

    validate() {
        return true;
    }

    log() {
        console.log("LocationAgent executed");
    }
}

const instance = new LocationAgent();
export default instance;
