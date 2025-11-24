import type { EventService } from "../EventService";
import type { ICellRenderer, ICellRendererParams } from "./CellRenderer";

// DefaultCellRenderer implementation
export class DefaultCellRenderer<TRowData> implements ICellRenderer<TRowData> {
    private eGui!: HTMLElement;
    private params!: ICellRendererParams<TRowData>;
    
    init(eventService: EventService): void {
        // this.params = params;
        this.eGui = document.createElement('div');
        this.eGui.className = 'cell';
    }
    
    getGui(): HTMLElement {
        return this.eGui;
    }
    
    refresh(params: ICellRendererParams<TRowData>): boolean {
        this.params = params;
        this.eGui.style.width = `${params.columnDef.width}px`;
        this.eGui.textContent = String(params.value ?? '');
        return true;
    }
    
    destroy(): void {
        
    }
}