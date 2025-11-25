import type { EventService } from "../EventService";
import type { ICellRenderer, ICellRendererParams } from "./CellRenderer";

export class GroupCellRenderer<TRowData> implements ICellRenderer<TRowData> {
    private eGui!: HTMLElement;
    private eBtn!: HTMLElement;
    private eTitle!: HTMLElement;
    private params!: ICellRendererParams<TRowData>;
    private btnListener!: () => void;
    
    init(eventService: EventService): void {
        this.eGui = document.createElement("div");
        this.eGui.className = "row-group";

        this.eBtn = document.createElement("button");
        this.eBtn.className = "row-group-expand-btn";

        this.eTitle = document.createElement("div");
        this.eTitle.className = "row-group-title";

        this.eGui.appendChild(this.eBtn);
        this.eGui.appendChild(this.eTitle);

        this.btnListener = () => {
            const key = this.params.context.groupNode.compositeKey;
            eventService.dispatchEvent("groupExpanded", { key: key });
        };
        this.eBtn.addEventListener("click", this.btnListener.bind(this));
    }
    
    getGui(): HTMLElement {
        return this.eGui;
    }
    
    refresh(params: ICellRendererParams<TRowData>): boolean {
        const { groupNode } = params.context;
        if (groupNode.expanded) {
            this.eBtn.classList.add("row-group-expand-btn-expanded");
            this.eBtn.textContent = "V";
        } else {
            this.eBtn?.classList.remove("row-group-expand-btn-expanded");
            this.eBtn.textContent = ">";
        }
        const itemsLabel = `${groupNode.count} item${groupNode.count > 1 ? "s" : ""}`;
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