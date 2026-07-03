import { RequestService } from "../services/RequestService";

export class AssignmentAgent {
    async execute(requestId: string, bookingId: string, providerName: string) {
        await RequestService.logTrace(requestId, "ASSIGNMENT_AGENT", "Technician assigned");

        return {
            bookingId,
            assigned: true,
            technicianName: providerName
        };
    }

    validate() {
        return true;
    }

    log() {
        console.log("AssignmentAgent executed");
    }
}

const instance = new AssignmentAgent();
export default instance;
