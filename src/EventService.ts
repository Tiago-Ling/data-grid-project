export type EventServiceListener<TData> = (type: string, data: TData) => void;

export class EventService {
    private listeners: Map<string, Function[]> = new Map<string, Function[]>();

    public addEventListener(eventType: string, listener: Function): void {
        let functions = this.listeners.get(eventType);
        if (!functions) {
            functions = [];
        }
        functions.push(listener);
        this.listeners.set(eventType, functions);
    }

    public removeEventListener(eventType: string, listener: Function): void {
        const functions = this.listeners.get(eventType);
        if (functions) {
            const index = functions.indexOf(listener);
            if (index > -1) {
                functions.splice(index, 1);
            }
        }
    }

    public dispatchEvent(eventType: string, event?: any): void {
        const functions = this.listeners.get(eventType);
        if (functions && functions.length > 0) {
            for (const f of functions) {
                f(event);
            }
        }
    }

    public destroy(): void {
        this.listeners.clear();
    }
}