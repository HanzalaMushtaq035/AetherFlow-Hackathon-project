export class ProviderService {
    async list() {
        return [];
    }

    async match(service: string) {
        return [];
    }

    async availability(providerId: string) {
        return true;
    }
}

export default new ProviderService();