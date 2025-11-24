import type { EventService } from "./EventService";
import type { IRowData, ColumnDef, ICellData } from "./Interfaces";
import type { GroupNode, RowNode } from "./RowModel";
import type { RowRenderInfo } from "./RowRenderer";

export class RowComponent<TRowData extends IRowData> {
    private rowRenderInfo: RowRenderInfo<TRowData> | null;
    private colDefs: ColumnDef<TRowData>[];
    private totalWidth: number;
    private eGui: HTMLElement;
    private cells: ICellData<TRowData>[] | null;
    private eventService: EventService;
    private type: string;

    constructor(rowRenderInfo: RowRenderInfo<TRowData>, colDefs: ColumnDef<TRowData>[], totalWidth: number, eventService: EventService) {
        this.rowRenderInfo = rowRenderInfo;
        this.colDefs = colDefs;
        this.totalWidth = totalWidth;
        this.cells = [];
        this.eGui = document.createElement('div');
        this.eGui.className = 'row';
        this.type = this.rowRenderInfo?.node.type === 'group' ? 'group' : 'row';
        this.eventService = eventService;

        this.init();
    }

    private init() {
        this.eGui.style.width = `${this.totalWidth}px`;
        this.eGui.style.height = `${this.rowRenderInfo?.height}px`;

        const colDefs = this.colDefs;
        const len = colDefs.length;
        let leftPos = 0;

        const isGroup = this.rowRenderInfo?.node.type === 'group';
        if (isGroup) {
            const eGroup = document.createElement('div');
            eGroup.className = 'row-group';

            const expandButton = document.createElement('button');
            expandButton.className = 'row-group-expand-btn';
            expandButton.textContent = '>';

            const eTitle = document.createElement('div');
            eTitle.className = 'row-group-title';

            eGroup.appendChild(expandButton);
            eGroup.appendChild(eTitle);

            eGroup.addEventListener('click', this.onRowClicked?.bind(this));
            // this.eventService.addEventListener('updateGroupNodeUI', this.onRowExpansionChanged.bind(this));
            this.eGui.appendChild(eGroup);
            
            const groupField = (this.rowRenderInfo?.node as GroupNode<TRowData>).field;
            this.cells!.push({ field: groupField, element: eTitle });
        } else {
            for (let i = 0; i < len; i++) {
                const col = colDefs[i];
                const eCell = document.createElement('div');

                eCell.className = 'cell';
                eCell.style.width = `${col.width}px`;

                this.eGui.appendChild(eCell);
                this.cells!.push({ field: col.field, element: eCell });
                leftPos += col.width || 100; // TODO: extract default column width
            }
        }

        if (this.rowRenderInfo) {
            this.setData(this.rowRenderInfo);
        }
    }

    public getType(): string {
        return this.type;
    }

    private onRowClicked(event: MouseEvent): void {
        const group = this.rowRenderInfo?.node as GroupNode<TRowData>;
        this.eventService.dispatchEvent('groupExpanded', { key: group.compositeKey });
    }

    public setData(renderInfo: RowRenderInfo<TRowData>) {
        if (renderInfo === null) return;
        const { index, node, height, position } = renderInfo;
        const isGroup = node.type === 'group';
        const yPos = position ?? (index * height);
        this.eGui.style.height = `${height}px`;
        this.eGui.style.transform = `translate3d(0, ${yPos}px, 0)`;

        const cells: ICellData<TRowData>[] = this.cells || [];
        if (isGroup) {
            const groupNode = node as GroupNode<TRowData>;
            const eBtn = this.eGui.querySelector('.row-group-expand-btn');
            cells[0].element.textContent = `${groupNode.key} ${groupNode.count}`;
            if (eBtn) {
                if (groupNode.expanded) {
                    eBtn.classList.add('row-group-expand-btn-expanded');
                    eBtn.textContent = 'V';
                } else {
                    eBtn?.classList.remove('row-group-expand-btn-expanded');
                    eBtn.textContent = '>';
                }
            }
            // this.type = 'group';
        } else {
            const rowNode = node as RowNode<TRowData>;
            const len = cells.length;
            for (let i = 0; i < len; i++) {
                const cell = cells[i];
                cell.element.textContent = String(rowNode.data[cell.field]);
            }
            // this.type = 'row';
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