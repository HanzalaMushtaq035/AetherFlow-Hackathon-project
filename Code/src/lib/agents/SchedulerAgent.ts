export class SchedulerAgent {
    execute(time?: string) {
        return {
            scheduled:
                time ||
                new Date().toISOString()
        };
    }

    validate() {
        return true;
    }

    log() { }
}

export default new SchedulerAgent();