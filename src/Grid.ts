import type { ColumnDef, GridOptions, IRowData, ScrollChangedEvent } from "./Interfaces";
import { EventService } from "./EventService";
import { RowModel, type ModelUpdatedEvent } from "./RowModel";
import { RowRenderer, type RowRenderData } from "./Rendering/RowRenderer";
import { HeaderComponent } from "./Components/HeaderComponent";

export class Grid<TRowData extends IRowData> {
    private eventService: EventService;
    private rowModel: RowModel<TRowData>;
    private header: HeaderComponent<TRowData>;
    private rowRenderer: RowRenderer<TRowData>;
    private scrollTop: number = 0;
    private scrollLeft: number = 0;

    constructor(eGridDiv: HTMLElement, gridOptions: GridOptions<TRowData>) {
        this.eventService = new EventService();
        this.eventService.addEventListener("scrollChanged", this.onScrollChanged.bind(this));
        this.eventService.addEventListener("modelUpdated", this.onModelUpdated.bind(this));

        this.rowModel = new RowModel<TRowData>(gridOptions, this.eventService);

        const eHeader = document.createElement("div");
        eHeader.className = "grid-header";
        eGridDiv.appendChild(eHeader);

        const eViewport = document.createElement("div");
        eViewport.className = "grid-viewport";
        eGridDiv.appendChild(eViewport);

        const rowWidth = this.getRowTotalWidth(gridOptions.columnDefs);
        this.header = new HeaderComponent<TRowData>(gridOptions.columnDefs, this.eventService, eViewport, rowWidth);
        eHeader.appendChild(this.header.getGui());
        
        this.rowRenderer = new RowRenderer<TRowData>(
            rowWidth,
            gridOptions.columnDefs,
            this.eventService,
            eViewport
        );

        const viewportHeight = this.rowRenderer.getViewportHeight();
        const initialRenderData = this.rowModel.calculateRowRenderData(0, viewportHeight);
        this.rowRenderer.drawVirtualRows(initialRenderData);

        console.log("Grid initialized");
    }

    private onScrollChanged(event: ScrollChangedEvent): void {
        if (event.scrollTop !== null && this.scrollTop !== event.scrollTop) {
            this.scrollTop = event.scrollTop;
            this.rowRenderer.onScrollTopChanged(this.getRowRenderData());
        }

        if (event.scrollLeft !== null && this.scrollLeft !== event.scrollLeft) {
            this.scrollLeft = event.scrollLeft;
            this.header.syncScroll(event.scrollLeft);
        }
    }

    private onModelUpdated(event: ModelUpdatedEvent<TRowData>): void {
        this.header.updateSortIndicators(event.sortModel);
        this.scrollTop = 0;
        this.rowRenderer.refreshRows(this.getRowRenderData(), true);
    }

    private getRowRenderData(): RowRenderData<TRowData> {
        const viewportHeight = this.rowRenderer.getViewportHeight();
        const renderData = this.rowModel.calculateRowRenderData(this.scrollTop, viewportHeight);
        return renderData;
    }

    private getRowTotalWidth(columnDefs: ColumnDef[]): number {
        const minColWidth = 100;
        const minRowWidth = 300;
        return columnDefs?.reduce((sum, col) => sum + (col.width || minColWidth), 0) || minRowWidth;
    }
}