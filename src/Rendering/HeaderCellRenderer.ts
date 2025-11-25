// import type { EventService } from "../EventService";
import type { ICellRenderer, ICellRendererParams } from "./CellRenderer";

export class HeaderCellRenderer implements ICellRenderer<any> {
    private eGui!: HTMLElement;
    private eCellText!: HTMLElement;
    private eSortIndicator!: HTMLElement;
    private eFilterIndicator!: HTMLElement;
    private eMenu!: HTMLElement;
    // private eventService!: EventService;
    
    init(): void {
        // this.eventService = eventService;

        this.eGui = document.createElement("div");
        this.eGui.className = "header-cell";
        this.eGui.style.cursor = "pointer";
        this.eGui.style.display = "flex";
        
        this.eCellText = document.createElement("span");
        this.eGui.appendChild(this.eCellText);
        
        this.eSortIndicator = document.createElement("span");
        this.eSortIndicator.className = "sort-indicator";
        this.eGui.appendChild(this.eSortIndicator);

        this.eFilterIndicator = document.createElement("span");
        this.eFilterIndicator.className = "filter-indicator";
        this.eFilterIndicator.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
        `;
        this.eGui.appendChild(this.eFilterIndicator);

        this.eMenu = document.createElement("span");
        this.eMenu.className = "header-menu";
        this.eMenu.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
            </svg>
        `;
        this.eGui.appendChild(this.eMenu);
    }
    
    getGui(): HTMLElement {
        return this.eGui;
    }
    
    refresh(params: ICellRendererParams<any>): boolean {
        const { columnDef, context } = params;
        
        this.eCellText.textContent = columnDef.headerName || String(columnDef.field);
        this.eGui.dataset.field = String(columnDef.field);
        this.eGui.style.width = `${columnDef.width}px`;
        
        if (context?.sortModel) {
            const sortState = context.sortModel.sorts.find(
                (s: any) => s.field === columnDef.field
            );
            if (sortState) {
                this.eSortIndicator.textContent = sortState.direction === "asc" ? "↑" : "↓";
                this.eSortIndicator.style.display = "inline";
            } else {
                this.eSortIndicator.textContent = "";
                this.eSortIndicator.style.display = "none";
            }
        }

        if (context?.filterModel) {
            const hasFilter = context.filterModel.filters.has(columnDef.field);
            if (hasFilter) {
                this.eFilterIndicator.classList.add("filter-active");
            } else {
                this.eFilterIndicator.classList.remove("filter-active");
            }
        }

        if (context?.groupModel) {
            // TODO: RowModel needs to send the column field here
            const hasGrouping = context.groupModel.groupBy[columnDef.field];
            if (hasGrouping) {
                this.eMenu.classList.add("menu-grouping");
            } else {
                this.eMenu.classList.remove("menu-grouping");
            }
        }

        return true;
    }
    
    destroy(): void {

    }
}