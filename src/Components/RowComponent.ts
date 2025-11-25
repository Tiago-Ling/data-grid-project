import type { IRowData, ColumnDef } from "../Interfaces";
import type { ICellRenderer } from "../Rendering/CellRenderer";
import { DefaultCellRenderer } from "../Rendering/DefaultCellRenderer";
import type { RowNode } from "../RowModel";
import type { RowRenderInfo } from "../Rendering/RowRenderer";
import type { IRowComponent } from "./IRowComponent";

export class RowComponent<TRowData extends IRowData> implements IRowComponent<TRowData> {
    private rowRenderInfo: RowRenderInfo<TRowData> | null;
    private colDefs: ColumnDef<TRowData>[];
    private totalWidth: number;
    private eGui: HTMLElement;
    private cells: {
        field: keyof TRowData;
        element: HTMLElement;
        renderer: ICellRenderer<TRowData>;
    }[];

    constructor(rowRenderInfo: RowRenderInfo<TRowData>, colDefs: ColumnDef<TRowData>[], totalWidth: number) {
        this.rowRenderInfo = rowRenderInfo;
        this.colDefs = colDefs;
        this.totalWidth = totalWidth;
        this.cells = [];
        
        this.eGui = document.createElement("div");
        this.eGui.className = "row";

        this.init();
        this.setData(rowRenderInfo);
    }

    private init() {
        const len = this.colDefs.length;
        
        for (let i = 0; i < len; i++) {
            const col = this.colDefs[i];
            const renderer = new DefaultCellRenderer<TRowData>();
            renderer.init();
            this.eGui.appendChild(renderer.getGui());
            this.cells.push({ field: col.field, element: renderer.getGui(), renderer: renderer });
        }
    }

    public getType(): string {
        return "row";
    }

    public setData(renderInfo: RowRenderInfo<TRowData>) {
        if (renderInfo === null) return;
        this.rowRenderInfo = renderInfo;

        const { index, node, height, position } = this.rowRenderInfo;
        const rowNode = node as RowNode<TRowData>;
        const yPos = position ?? (index * height);

        this.eGui.style.width = `${this.totalWidth}px`;
        this.eGui.style.height = `${height}px`;
        this.eGui.style.transform = `translate3d(0, ${yPos}px, 0)`;

        const len = this.cells.length;
        for (let i = 0; i < len; i++) {
            const cell = this.cells[i];
            cell.renderer.refresh({
                value: rowNode.data[cell.field],
                data: rowNode.data,
                field: cell.field,
                rowIndex: index,
                columnDef: this.colDefs[i],
                eParent: cell.element
            });
        }
    }

    public getGui() {
        return this.eGui;
    }

    public destroy() {
        for (const cell of this.cells) {
            cell.renderer.destroy();
        }
        this.cells = [];
        this.rowRenderInfo = null;
    }
}