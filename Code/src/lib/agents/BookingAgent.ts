import { RequestService } from "../services/RequestService";
import { Booking } from "@/types/database";

export class BookingAgent {
    async execute(requestId: string, providerId: string, scheduledTime: string): Promise<Booking> {
        // Strict 5-second timeout on Booking registrations
        return Promise.race([
            this.createBookingRecord(requestId, providerId, scheduledTime),
            new Promise<any>((_, reject) => setTimeout(() => {
                reject(new Error("BookingAgent timed out after 5000ms. Booking could not be written to database."));
            }, 5000))
        ]);
    }

    private async createBookingRecord(requestId: string, providerId: string, scheduledTime: string): Promise<Booking> {
        // Create the real persistent booking in Supabase
        const booking = await RequestService.createBooking(requestId, providerId, scheduledTime);
        
        await RequestService.logTrace(requestId, "BOOKING_AGENT", "Booking created");

        return booking;
    }

    validate() {
        return true;
    }

    log() {
        console.log("BookingAgent executed");
    }
}

const instance = new BookingAgent();
export default instance;
