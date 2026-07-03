import { RequestService } from "../services/RequestService";

export class TraceAgent {

    async execute(
        requestId: string,
        action: string
    ) {

        return RequestService.logTrace(
            requestId,
            "TRACE_AGENT",
            action
        );

    }

    validate() {
        return true;
    }

    log() { }

}

export default new TraceAgent();