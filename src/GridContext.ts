/**
 * GridContext holds the unique identifier for a Grid instance.
 *
 * This lightweight context object is passed to components instead of services,
 * enabling them to access their Grid's services via the ServiceLocator while
 * maintaining per-Grid isolation.
 *
 * @example
 * ```typescript
 * const context = new GridContext();
 * const eventService = ServiceAccess.getEventService(context);
 * ```
 */
export class GridContext {
    private readonly contextId: string;
    private static counter: number = 0;

    /**
     * Creates a new GridContext with a unique identifier.
     * @param contextId - Optional custom context ID. If not provided, a unique ID is generated.
     */
    constructor(contextId?: string) {
        this.contextId = contextId || GridContext.generateContextId();
    }

    /**
     * Gets the unique context identifier for this Grid instance.
     * @returns The context ID string
     */
    public getContextId(): string {
        return this.contextId;
    }

    /**
     * Generates a unique context ID using timestamp, counter, and random component.
     * Format: grid_{timestamp}_{counter}_{random}
     * @returns A unique context ID string
     */
    private static generateContextId(): string {
        return `grid_${Date.now()}_${GridContext.counter++}_${Math.random().toString(36).substring(2, 9)}`;
    }
}
