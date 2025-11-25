import type { ColumnDef, IRowData } from "../Interfaces";
import { type IRowComponent } from "../Components/IRowComponent";
import { RowComponent } from "../Components/RowComponent";
import { GroupRowComponent } from "../Components/GroupRowComponent";
import type { EventService } from "../EventService";
import type { TreeNode } from "../RowModel";

export interface RowRenderInfo<TRowData extends IRowData> {
    index: number;
    node: TreeNode<TRowData>;
    height: number;
    position: number;
}

export interface RowRenderData<TRowData extends IRowData> {
    totalHeight: number;
    rows: Map<number, RowRenderInfo<TRowData>>;
}

export class RowRenderer<TRowData extends IRowData> {
    private viewport: HTMLElement;
    private container: HTMLElement;
    private rowWidth: number;
    private columnDefs: ColumnDef[];
    private eventService: EventService;
    private activeRows: Map<number, IRowComponent<TRowData>>;
    private inactiveRows: IRowComponent<TRowData>[];
    private rafPending: number | null = null;
    private scrollTimeout: number | null = null;

    constructor(
        rowWidth: number,
        columnDefs: ColumnDef[],
        eventService: EventService,
        eViewport: HTMLElement
    ) {
        this.rowWidth = rowWidth;
        this.columnDefs = columnDefs;

        this.eventService = eventService;
        this.viewport = eViewport;

        this.activeRows = new Map();
        this.inactiveRows = [];
        
        this.container = document.createElement("div");
        this.container.className = "grid-center-container";
        this.viewport.appendChild(this.container);

        this.viewport.addEventListener("scroll", this.onScroll.bind(this));
        this.eventService.addEventListener("scrollTopChanged", this.onScrollTopChanged.bind(this));
    }

    public drawVirtualRows(renderData: RowRenderData<TRowData>) {
        const { totalHeight, rows } = renderData;
        this.container.style.height = `${totalHeight}px`;

        // Recycle rows outside of view
        for (const [index, activeRow] of this.activeRows) {
            if (!rows.has(index)) {
                this.releaseRowComponent(activeRow);
                this.activeRows.delete(index);
            }
        }

        // Add visible rows to the DOM
        const fragment = document.createDocumentFragment();
        for (const [rowIndex, rowInfo] of rows) {
            let existingRow = this.activeRows.get(rowIndex);
            if (existingRow) {
                existingRow.setData(rowInfo);
            } else {
                const row = this.getRowComponent(rowInfo);
                this.activeRows.set(rowIndex, row);
                fragment.appendChild(row.getGui());
            }
        }

        if (rows.size > 0) {
            this.container.appendChild(fragment);
        }
    }

    public getViewportHeight(): number {
        return this.viewport.clientHeight;
    }

    public refreshRows(rowRenderData: RowRenderData<TRowData>, resetScroll: boolean = false): void {
        for (const [index, activeRow] of this.activeRows) {
            this.releaseRowComponent(activeRow);
            this.activeRows.delete(index);
        }

        if (resetScroll) {
            this.viewport.scrollTop = 0;
        }

        if (rowRenderData) {
            this.drawVirtualRows(rowRenderData);
        }
    }

    public onScrollTopChanged(rowData: RowRenderData<TRowData>): void {
        if (this.rafPending !== null) {
            return;
        }
        this.rafPending = requestAnimationFrame(() => {
            this.rafPending = null;
            this.drawVirtualRows(rowData);
        });
    }

    private onScroll() {
        if (this.activeRows.size > 0) {
            for (const row of this.activeRows.values()) {
                row.getGui().classList.add("grid-row-scrolling");
            }
        }

        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        this.scrollTimeout = setTimeout(() => {
            for (const row of this.activeRows.values()) {
                row.getGui().classList.remove("grid-row-scrolling");
            }
        }, 150);

        const scrollTop = this.viewport.scrollTop;
        const scrollLeft = this.viewport.scrollLeft;
        this.eventService.dispatchEvent("scrollChanged", { scrollTop, scrollLeft });
    }

    private getRowComponent(rowInfo: RowRenderInfo<TRowData>): IRowComponent<TRowData> {
        const requiredType = rowInfo.node.type === "group" ? "group" : "row";
        const compatibleIndex = this.inactiveRows.findIndex(comp => comp.getType() === requiredType);
        if (compatibleIndex !== -1) {
            const row = this.inactiveRows.splice(compatibleIndex, 1)[0];
            row.setData(rowInfo);
            return row;
        }

        if (rowInfo.node.type === "group") {
            return new GroupRowComponent<TRowData>(rowInfo, this.columnDefs, this.rowWidth, this.eventService);
        } else {
            return new RowComponent<TRowData>(rowInfo, this.columnDefs, this.rowWidth);
        }
    }

    private releaseRowComponent(rowComp: IRowComponent<TRowData>) {
        const eGui = rowComp.getGui();
        if (eGui && eGui.parentNode) {
            eGui.remove();
        }
        this.inactiveRows.push(rowComp);
    }
}