import type { GridOptions, IRowData, ScrollChangedEvent } from "./Interfaces";
import { EventService } from "./EventService";
import { RowModel, type ModelUpdatedData } from "./RowModel";
import { RowRenderer, type RowRenderData } from "./Rendering/RowRenderer";
import { HeaderComponent } from "./Components/HeaderComponent";
import { GridContext } from "./GridContext";
import { ServiceLocator, ServiceNames } from "./ServiceLocator";
import { MIN_COL_WIDTH, MIN_ROW_WIDTH } from "./Constants";

export class Grid<TRowData extends IRowData> {
    private context: GridContext;
    private eventService: EventService;
    private rowModel: RowModel<TRowData>;
    private header: HeaderComponent<TRowData>;
    private rowRenderer: RowRenderer<TRowData>;
    private scrollTop: number = 0;
    private scrollLeft: number = 0;

    constructor(eGridDiv: HTMLElement, gridOptions: GridOptions<TRowData>) {
        this.context = new GridContext();
        this.eventService = new EventService();

        const locator = ServiceLocator.getInstance();
        locator.registerService(
            this.context.getContextId(),
            ServiceNames.EVENT_SERVICE,
            this.eventService
        );

        this.eventService.addEventListener("scrollChanged", this.onScrollChanged.bind(this));
        this.eventService.addEventListener("modelUpdated", this.onModelUpdated.bind(this));

        this.rowModel = new RowModel<TRowData>(gridOptions, this.context);

        const eHeader = document.createElement("div");
        eHeader.className = "grid-header";
        eGridDiv.appendChild(eHeader);

        const eViewport = document.createElement("div");
        eViewport.className = "grid-viewport";
        eGridDiv.appendChild(eViewport);

        const colDefs = gridOptions.columnDefs;
        const rowWidth = colDefs?.reduce((sum, col) => sum + (col.width || MIN_COL_WIDTH), 0) || MIN_ROW_WIDTH;
        this.header = new HeaderComponent<TRowData>(colDefs, this.context, eViewport, rowWidth);
        eHeader.appendChild(this.header.getGui());

        this.rowRenderer = new RowRenderer<TRowData>(
            rowWidth,
            colDefs,
            this.context,
            eViewport
        );

        const initialRenderData = this.getRenderData();
        this.rowRenderer.drawVirtualRows(initialRenderData);
    }

    private onScrollChanged(event: ScrollChangedEvent): void {
        if (event.scrollTop !== null && this.scrollTop !== event.scrollTop) {
            this.scrollTop = event.scrollTop;
            const renderData = this.getRenderData();
            this.rowRenderer.onScrollTopChanged(renderData);
        }

        if (event.scrollLeft !== null && this.scrollLeft !== event.scrollLeft) {
            this.scrollLeft = event.scrollLeft;
            this.header.syncScroll(event.scrollLeft);
        }
    }

    private onModelUpdated(_event: ModelUpdatedData<TRowData>): void {
        const renderData = this.getRenderData();
        this.rowRenderer.refreshRows(renderData, this.scrollTop);
    }

    private getRenderData(): RowRenderData<TRowData> {
        const viewportHeight = this.rowRenderer.getViewportHeight();
        return this.rowModel.calculateRowRenderData(this.scrollTop, viewportHeight);
    }

    public destroy(): void {
        // Destroy components in reverse order of creation
        this.rowRenderer.destroy();
        this.header.destroy();
        this.rowModel.destroy();

        this.eventService.destroy();

        const locator = ServiceLocator.getInstance();
        locator.unregisterContext(this.context.getContextId());
    }
}