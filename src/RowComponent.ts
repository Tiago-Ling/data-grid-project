import type { IRowData, ColumnDef, ICellData } from "./Interfaces";
import type { RowRenderInfo } from "./RowRenderer";

export class RowComponent<TRowData extends IRowData> {
    private rowRenderInfo: RowRenderInfo<TRowData> | null;
    private colDefs: ColumnDef<TRowData>[];
    private totalWidth: number;
    private eGui: HTMLElement;
    private cells: ICellData<TRowData>[] | null;

    constructor(rowRenderInfo: RowRenderInfo<TRowData>, colDefs: ColumnDef<TRowData>[], totalWidth: number) {
        this.rowRenderInfo = rowRenderInfo;
        this.colDefs = colDefs;
        this.totalWidth = totalWidth;
        this.cells = [];
        this.eGui = document.createElement('div');
        this.eGui.className = 'row';

        this.init();
    }

    private init() {
        this.eGui.style.width = `${this.totalWidth}px`;
        this.eGui.style.height = `${this.rowRenderInfo?.height}px`;

        const colDefs = this.colDefs;
        const len = colDefs.length;
        let leftPos = 0;

        for (let i = 0; i < len; i++) {
            const col = colDefs[i];
            const eCell = document.createElement('div');

            eCell.className = 'cell';
            eCell.style.width = `${col.width}px`;

            this.eGui.appendChild(eCell);
            this.cells!.push({ field: col.field, element: eCell });
            leftPos += col.width || 100; // TODO: extract default column width
        }

        if (this.rowRenderInfo) {
            this.setData(this.rowRenderInfo);
        }
    }

    public setData(renderInfo: RowRenderInfo<TRowData>) {
        const { index, data, height, position } = renderInfo;
        if (renderInfo !== undefined) {
            this.eGui.style.height = `${height}px`;
        }

        const yPos = position ?? (index !== undefined ? index * height : data.id * height);
        this.eGui.style.transform = `translate3d(0, ${yPos}px, 0)`;

        const cells: ICellData<TRowData>[] = this.cells || [];
        const len = cells.length;
        for (let i = 0; i < len; i++) {
            const cell = cells[i];
            cell.element.textContent = String(data[cell.field]);
        }
        this.rowRenderInfo = renderInfo;
    }

    public getGui() {
        return this.eGui;
    }

    public destroy() {
        this.rowRenderInfo = null;
        this.cells = null;
    }

    public refresh(): boolean {
        return false;
    }
}