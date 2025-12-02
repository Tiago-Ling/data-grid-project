import type { ColumnDef, IRowData } from "../Interfaces";
import { type IRowComponent } from "../Components/IRowComponent";
import { RowComponent } from "../Components/RowComponent";
import { GroupRowComponent } from "../Components/GroupRowComponent";
import type { TreeNode } from "../RowModel";
import { GridContext } from "../GridContext";
import { ServiceAccess } from "../ServiceAccess";

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
    private context: GridContext;
    private activeRows: Map<number, IRowComponent<TRowData>>;
    private inactiveRows: IRowComponent<TRowData>[];
    private rafPending: number | null = null;
    private scrollTimeout: number | null = null;
    private onScrollBound: () => void;

    constructor(
        rowWidth: number,
        columnDefs: ColumnDef[],
        context: GridContext,
        eViewport: HTMLElement
    ) {
        this.rowWidth = rowWidth;
        this.columnDefs = columnDefs;

        this.context = context;
        this.viewport = eViewport;

        this.activeRows = new Map();
        this.inactiveRows = [];

        this.container = document.createElement("div");
        this.container.className = "grid-center-container";
        this.viewport.appendChild(this.container);

        this.onScrollBound = this.onScroll.bind(this);
        this.viewport.addEventListener("scroll", this.onScrollBound);
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

    public refreshRows(rowRenderData: RowRenderData<TRowData>, scrollTop: number, resetScroll?: boolean): void {
        for (const [index, activeRow] of this.activeRows) {
            this.releaseRowComponent(activeRow);
            this.activeRows.delete(index);
        }

        this.viewport.scrollTop = resetScroll ? 0 : scrollTop;

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
        // Add scrolling class to container for GPU acceleration
        this.container.classList.add("grid-container-scrolling");

        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        this.scrollTimeout = setTimeout(() => {
            this.container.classList.remove("grid-container-scrolling");
        }, 150);

        const scrollTop = this.viewport.scrollTop;
        const scrollLeft = this.viewport.scrollLeft;
        const eventService = ServiceAccess.getEventService(this.context);
        eventService.dispatchEvent("scrollChanged", { scrollTop, scrollLeft });
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
            return new GroupRowComponent<TRowData>(rowInfo, this.columnDefs, this.rowWidth, this.context);
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

    public destroy(): void {
        // Cancel pending animation frame
        if (this.rafPending !== null) {
            cancelAnimationFrame(this.rafPending);
            this.rafPending = null;
        }

        // Clear scroll timeout
        if (this.scrollTimeout !== null) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }

        // Remove scroll event listener
        this.viewport.removeEventListener("scroll", this.onScrollBound);

        // Destroy all active row components
        for (const rowComp of this.activeRows.values()) {
            rowComp.destroy();
        }
        this.activeRows.clear();

        // Destroy all inactive row components
        for (const rowComp of this.inactiveRows) {
            rowComp.destroy();
        }
        this.inactiveRows = [];

        // Remove container from DOM
        if (this.container.parentNode) {
            this.container.remove();
        }
    }
}