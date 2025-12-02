import type { IRowData, ColumnDef } from "../Interfaces";
import type { ICellRenderer, IGroupCellRendererContext } from "../Rendering/CellRenderer";
import { GroupCellRenderer } from "../Rendering/GroupCellRenderer";
import type { GroupNode } from "../RowModel";
import type { RowRenderInfo } from "../Rendering/RowRenderer";
import type { IRowComponent } from "./IRowComponent";
import { GridContext } from "../GridContext";

export class GroupRowComponent<TRowData extends IRowData> implements IRowComponent<TRowData> {
    private rowRenderInfo: RowRenderInfo<TRowData> | null;
    private colDefs: ColumnDef<TRowData>[];
    private totalWidth: number;
    private eGui: HTMLElement;
    private renderer: ICellRenderer<TRowData> | null;
    private context: GridContext;

    constructor(rowRenderInfo: RowRenderInfo<TRowData>, colDefs: ColumnDef<TRowData>[], totalWidth: number, context: GridContext) {
        this.rowRenderInfo = rowRenderInfo;
        this.colDefs = colDefs;
        this.totalWidth = totalWidth;
        this.renderer = null;
        this.context = context;

        this.eGui = document.createElement("div");
        this.eGui.className = "row";

        this.init();
        this.setData(rowRenderInfo);
    }

    private init() {
        const renderer = new GroupCellRenderer<TRowData>();
        renderer.init(this.context);
        this.eGui.appendChild(renderer.getGui());
        this.renderer = renderer;
    }

    public getType(): string {
        return "group";
    }

    public setData(renderInfo: RowRenderInfo<TRowData>) {
        if (renderInfo === null) return;
        this.rowRenderInfo = renderInfo;
        const { index, node, height, position } = this.rowRenderInfo;
        const groupNode = node as GroupNode<TRowData>;
        const yPos = position ?? (index * height);

        this.eGui.style.width = `${this.totalWidth}px`;
        this.eGui.style.height = `${height}px`;
        this.eGui.style.transform = `translate3d(0, ${yPos}px, 0)`;

        if (this.renderer) {
            const colDef = this.colDefs.find(v => v.field === groupNode.field) || {
                field: groupNode.field,
                headerName: String(groupNode.field),
                width: this.totalWidth
            };

            const groupContext: IGroupCellRendererContext<TRowData> = {
                groupNode: groupNode,
                gridContext: this.context
            };

            this.renderer.refresh({
                value: groupNode.key,
                data: null,
                field: groupNode.field,
                rowIndex: index,
                columnDef: colDef,
                eParent: this.eGui,
                context: groupContext
            });
        }
    }

    public getGui() {
        return this.eGui;
    }

    public destroy() {
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }
        this.rowRenderInfo = null;
    }
}