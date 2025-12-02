/**
 * Custom error thrown when a service context is not found in the ServiceLocator.
 */
export class ServiceContextNotFoundError extends Error {
    constructor(contextId: string) {
        super(`No services registered for context: ${contextId}`);
        this.name = "ServiceContextNotFoundError";
    }
}

/**
 * Custom error thrown when a specific service is not found in a context.
 */
export class ServiceNotFoundError extends Error {
    constructor(serviceName: string, contextId: string) {
        super(`Service '${serviceName}' not found in context: ${contextId}`);
        this.name = "ServiceNotFoundError";
    }
}

/**
 * ServiceLocator manages service instances per Grid context.
 * Each Grid has its own isolated set of services accessed via unique context IDs.
 */
export class ServiceLocator {
    private services: Map<string, Map<string, any>> = new Map();
    private static globalInstance: ServiceLocator = new ServiceLocator();

    private constructor() {}

    public static getInstance(): ServiceLocator {
        return ServiceLocator.globalInstance;
    }

    public registerService<T>(contextId: string, serviceName: string, serviceInstance: T): void {
        if (!this.services.has(contextId)) {
            this.services.set(contextId, new Map());
        }
        const contextServices = this.services.get(contextId)!;
        contextServices.set(serviceName, serviceInstance);
    }

    public getService<T>(contextId: string, serviceName: string): T {
        const contextServices = this.services.get(contextId);
        if (!contextServices) {
            throw new ServiceContextNotFoundError(contextId);
        }
        const service = contextServices.get(serviceName);
        if (!service) {
            throw new ServiceNotFoundError(serviceName, contextId);
        }
        return service as T;
    }

    public unregisterContext(contextId: string): void {
        const contextServices = this.services.get(contextId);
        if (contextServices) {
            const eventService = contextServices.get("eventService");
            if (eventService && typeof eventService.destroy === "function") {
                eventService.destroy();
            }
            contextServices.clear();
            this.services.delete(contextId);
        }
    }
}

export const ServiceNames = {
    EVENT_SERVICE: "eventService"
} as const;
