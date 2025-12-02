import type { ICellRenderer, ICellRendererParams, IGroupCellRendererContext } from "./CellRenderer";
import type { IRowData } from "../Interfaces";
import { GridContext } from "../GridContext";
import { ServiceAccess } from "../ServiceAccess";

export class GroupCellRenderer<TRowData extends IRowData> implements ICellRenderer<TRowData> {
    private eGui!: HTMLElement;
    private eBtn!: HTMLElement;
    private eTitle!: HTMLElement;
    private params!: ICellRendererParams<TRowData>;
    private btnListener!: () => void;
    private context!: GridContext;

    init(context: GridContext): void {
        this.context = context;
        this.eGui = document.createElement("div");
        this.eGui.className = "row-group";

        this.eBtn = document.createElement("button");
        this.eBtn.className = "row-group-expand-btn";

        this.eTitle = document.createElement("div");
        this.eTitle.className = "row-group-title";

        this.eGui.appendChild(this.eBtn);
        this.eGui.appendChild(this.eTitle);

        this.btnListener = () => {
            if (this.params?.context) {
                const groupContext = this.params.context as IGroupCellRendererContext<TRowData>;
                const key = groupContext.groupNode.compositeKey;
                const eventService = ServiceAccess.getEventService(this.context);
                eventService.dispatchEvent("groupExpanded", { key: key });
            }
        };
        this.eBtn.addEventListener("click", this.btnListener.bind(this));
    }
    
    getGui(): HTMLElement {
        return this.eGui;
    }
    
    refresh(params: ICellRendererParams<TRowData>): boolean {
        const groupContext = params.context as IGroupCellRendererContext<TRowData>;
        const { groupNode } = groupContext;
        if (groupNode.expanded) {
            this.eBtn.classList.add("row-group-expand-btn-expanded");
            this.eBtn.textContent = "V";
        } else {
            this.eBtn?.classList.remove("row-group-expand-btn-expanded");
            this.eBtn.textContent = ">";
        }
        const count = groupNode.count ?? 0;
        const itemsLabel = `${count} item${count > 1 ? "s" : ""}`;
        this.eTitle.textContent = `${groupNode.key} - ${itemsLabel}`;
        this.params = params;
        return true;
    }
    
    destroy(): void {
        if (this.btnListener !== null) {
            this.eBtn.removeEventListener("click", this.btnListener);
        }
    }
}