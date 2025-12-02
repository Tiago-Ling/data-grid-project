import { ServiceLocator, ServiceNames } from "./ServiceLocator";
import { EventService } from "./EventService";
import type { GridContext } from "./GridContext";

/**
 * ServiceAccess provides type-safe helper methods for accessing services
 * from the ServiceLocator.
 *
 * This class serves as a facade to simplify service retrieval and maintain
 * type safety throughout the application. It eliminates the need to
 * remember service names and provides compile-time type checking.
 *
 * @example
 * ```typescript
 * const eventService = ServiceAccess.getEventService(this.context);
 * eventService.dispatchEvent("myEvent", data);
 * ```
 */
export class ServiceAccess {
    /**
     * Gets the EventService for a specific Grid context.
     *
     * @param context - The GridContext identifying which Grid's EventService to retrieve
     * @returns The EventService instance for the specified Grid
     * @throws {ServiceContextNotFoundError} If no services are registered for the context
     * @throws {ServiceNotFoundError} If EventService is not found in the context
     */
    public static getEventService(context: GridContext): EventService {
        const locator = ServiceLocator.getInstance();
        return locator.getService<EventService>(
            context.getContextId(),
            ServiceNames.EVENT_SERVICE
        );
    }
}
