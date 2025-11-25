import type { ColumnDef, IRowData } from "../Interfaces";
import type { EventService } from "../EventService";
import type { SortModel } from "../RowModel";
import type { ICellRenderer } from "../Rendering/CellRenderer";
import { HeaderCellRenderer } from "../Rendering/HeaderCellRenderer";
import { FilterPopoverComponent } from "../Components/FilterPopoverComponent";

export class HeaderComponent<TRowData extends IRowData> {
    private eGui: HTMLElement;
    private headerInner: HTMLElement;
    private columnDefs: ColumnDef<TRowData>[];
    private eventService: EventService;
    private headerCells: Map<string, ICellRenderer<TRowData>>;
    private filterPopover: FilterPopoverComponent;
    private onHeaderCellClicked?: (event: MouseEvent) => void;
    private resizeObserver: ResizeObserver | null = null;
    private viewport: HTMLElement;
    private totalWidth: number;

    constructor(columnDefs: ColumnDef<TRowData>[], eventService: EventService, viewport: HTMLElement, totalWidth: number) {
        this.columnDefs = columnDefs;
        this.eventService = eventService;
        this.viewport = viewport;
        this.totalWidth = totalWidth;
        this.headerCells = new Map();
        
        this.eGui = document.createElement("div");
        this.eGui.className = "grid-header";
        
        this.headerInner = document.createElement("div");
        this.headerInner.style.display = "flex";
        this.eGui.appendChild(this.headerInner);
        
        this.filterPopover = new FilterPopoverComponent(eventService);
        document.body.appendChild(this.filterPopover.getGui());
        
        this.createHeaderCells();
        this.setupEventListeners();
        this.setupScrollbarPadding();
        
        this.eventService.addEventListener("modelUpdated", this.onModelUpdated.bind(this));
    }
    
    private createHeaderCells(): void {
        for (const colDef of this.columnDefs) {
            const renderer = new HeaderCellRenderer();
            renderer.init();
            
            renderer.refresh({
                value: null,
                data: null,
                field: colDef.field,
                rowIndex: -1,
                columnDef: colDef,
                eParent: this.headerInner,
                context: {
                    totalWidth: this.totalWidth
                }
            });
            
            this.headerInner.appendChild(renderer.getGui());
            this.headerCells.set(String(colDef.field), renderer);
        }
    }
    
    private setupEventListeners(): void {
        this.onHeaderCellClicked = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const headerCell = target.closest(".header-cell") as HTMLElement;
            const field = headerCell?.dataset.field;
            
            if (!field) return;
            
            if (target.classList.contains("header-menu") || target.closest(".header-menu")) {
                this.eventService.dispatchEvent("groupByToggled", field as keyof TRowData);
                event.stopPropagation();
                return;
            }
            
            if (target.classList.contains("filter-indicator") || target.closest(".filter-indicator")) {
                this.filterPopover.show(field, headerCell);
                event.stopPropagation();
                return;
            }
            
            if (headerCell) {
                this.eventService.dispatchEvent("sortChanged", { 
                    field, 
                    shiftKey: event.shiftKey 
                });
                event.stopPropagation();
            }
        };
        this.headerInner.addEventListener("click", this.onHeaderCellClicked);
    }

    private setupScrollbarPadding(): void {
        const updatePadding = () => {
            const scrollbarWidth = this.viewport.offsetWidth - this.viewport.clientWidth;
            this.eGui.style.paddingRight = `${scrollbarWidth}px`;
        };
        
        updatePadding();
        
        this.resizeObserver = new ResizeObserver(updatePadding);
        this.resizeObserver.observe(this.viewport);
    }
    
    private onModelUpdated(event: any): void {
        const { sortModel, filterModel } = event;
        for (const [field, renderer] of this.headerCells) {
            const colDef = this.columnDefs.find(c => String(c.field) === field);
            if (colDef) {
                renderer.refresh({
                    value: null,
                    data: null,
                    field: colDef.field,
                    rowIndex: -1,
                    columnDef: colDef,
                    eParent: this.headerInner,
                    context: { sortModel, filterModel }
                });
            }
        }
    }
    
    public syncScroll(scrollLeft: number): void {
        if (this.eGui.scrollLeft !== scrollLeft) {
            this.eGui.scrollLeft = scrollLeft;
        }
    }
    
    public updateSortIndicators(sortModel: SortModel): void {
        for (const [field, renderer] of this.headerCells) {
            const colDef = this.columnDefs.find(c => String(c.field) === field);
            if (colDef) {
                renderer.refresh({
                    value: null,
                    data: null,
                    field: colDef.field,
                    rowIndex: -1,
                    columnDef: colDef,
                    eParent: this.headerInner,
                    context: { sortModel }
                });
            }
        }
    }
    
    public getGui(): HTMLElement {
        return this.eGui;
    }
    
    public destroy(): void {
        if (this.onHeaderCellClicked) {
            this.headerInner.removeEventListener("click", this.onHeaderCellClicked);
        }
        
        for (const renderer of this.headerCells.values()) {
            renderer.destroy();
        }
        this.headerCells.clear();
        
        this.filterPopover.destroy();
    }
}