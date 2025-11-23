import type { ColumnDef, GridOptions, IRowData, ScrollChangedEvent } from "./Interfaces";
import { EventService } from "./EventService";
import { RowModel, type ModelUpdatedEvent } from "./RowModel";
import { RowRenderer, type RowRenderData } from "./RowRenderer";
import { HeaderComponent } from "./HeaderComponent";

export class Grid<TRowData extends IRowData> {
    private eventService: EventService;
    private rowModel: RowModel<TRowData>;
    private headerController: HeaderComponent<TRowData>;
    private rowRenderer: RowRenderer<TRowData>;
    private scrollTop: number = 0;
    private scrollLeft: number = 0;

    constructor(eGridDiv: HTMLElement, gridOptions: GridOptions<TRowData>) {
        this.eventService = new EventService();
        this.eventService.addEventListener('scrollChanged', this.onScrollChanged.bind(this));
        this.eventService.addEventListener('modelUpdated', this.onModelUpdated.bind(this));

        const rowHeight = gridOptions.rowHeight || 40;
        this.rowModel = new RowModel<TRowData>(gridOptions.rowData, this.eventService, rowHeight, gridOptions.getRowHeightCallback);

        const eHeader = document.createElement('div');
        eHeader.className = 'grid-header';
        eGridDiv.appendChild(eHeader);

        const eViewport = document.createElement('div');
        eViewport.className = 'grid-viewport';
        eGridDiv.appendChild(eViewport);

        const rowWidth = this.getRowTotalWidth(gridOptions.columnDefs);
        this.headerController = new HeaderComponent<TRowData>(eHeader, eViewport, this.eventService);
        this.headerController.init(gridOptions.columnDefs, rowWidth);
        
        this.rowRenderer = new RowRenderer<TRowData>(
            rowWidth,
            gridOptions.columnDefs,
            this.eventService,
            eViewport
        );

        // Initial Draw
        const viewportHeight = this.rowRenderer.getViewportHeight();
        const initialRenderData = this.rowModel.calculateRowRenderData(0, viewportHeight);
        this.rowRenderer.drawVirtualRows(initialRenderData);

        console.log('Grid initialized');
    }

    private onScrollChanged(event: ScrollChangedEvent): void {
        if (event.scrollTop !== null && this.scrollTop !== event.scrollTop) {
            this.scrollTop = event.scrollTop;
            this.rowRenderer.onScrollTopChanged(this.getRowRenderData());
        }

        if (event.scrollLeft !== null && this.scrollLeft !== event.scrollLeft) {
            this.scrollLeft = event.scrollLeft;
            this.headerController.syncScroll(event.scrollLeft);
        }
    }

    private onModelUpdated(event: ModelUpdatedEvent<TRowData>): void {
        this.headerController.updateSortIndicators(event.sortModel);
        this.scrollTop = 0;
        this.rowRenderer.refreshRows(this.getRowRenderData());
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