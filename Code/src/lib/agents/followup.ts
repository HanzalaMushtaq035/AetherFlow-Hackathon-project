import { RequestService } from "../services/RequestService";

export const FollowupAgent = {
  async processFollowup(bookingId: string, status: string, context?: string) {
    let message = "";
    if (status === "accepted") {
      message = "Technician has accepted your request and will be preparing to visit.";
    } else if (status === "en_route") {
      message = "Reminder: Your technician is on the way. Please ensure someone is available.";
    } else if (status === "completed") {
      message = `Service completed successfully! Please provide a rating. ${context || ""}`;
    }

    if (message) {
      try {
        await RequestService.createFollowup(bookingId, message);
      } catch (err) {
        console.error("Followup Agent failed to create followup:", err);
      }
    }
  }
};
