import type { EventService } from "../EventService";

export class FilterPopoverComponent {
    private eGui: HTMLElement;
    private eInput: HTMLInputElement;
    private eApplyBtn: HTMLButtonElement;
    private eClearBtn: HTMLButtonElement;
    private eventService: EventService;
    private currentField: string | null = null;
    
    constructor(eventService: EventService) {
        this.eventService = eventService;
        
        this.eGui = document.createElement("div");
        this.eGui.className = "filter-popover";
        this.eGui.style.display = "none";
        
        this.eInput = document.createElement("input");
        this.eInput.type = "text";
        this.eInput.className = "filter-input";
        this.eInput.placeholder = "Filter...";
        
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "filter-buttons";
        
        this.eApplyBtn = document.createElement("button");
        this.eApplyBtn.className = "filter-apply-btn";
        this.eApplyBtn.textContent = "Apply";
        
        this.eClearBtn = document.createElement("button");
        this.eClearBtn.className = "filter-clear-btn";
        this.eClearBtn.textContent = "Clear";
        
        buttonContainer.appendChild(this.eApplyBtn);
        buttonContainer.appendChild(this.eClearBtn);
        
        this.eGui.appendChild(this.eInput);
        this.eGui.appendChild(buttonContainer);
        
        this.eApplyBtn.addEventListener("click", this.handleApply.bind(this));
        this.eClearBtn.addEventListener("click", this.handleClear.bind(this));
        this.eInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.handleApply();
            } else if (e.key === "Escape") {
                this.hide();
            }
        });
        
        document.addEventListener("click", (e) => {
            if (!this.eGui.contains(e.target as Node)) {
                this.hide();
            }
        });
    }
    
    public show(field: string, anchorElement: HTMLElement, currentValue: string = ""): void {
        this.currentField = field;
        this.eInput.value = currentValue;
        this.eGui.style.display = "block";
        
        const rect = anchorElement.getBoundingClientRect();
        this.eGui.style.position = "fixed";
        this.eGui.style.left = `${rect.left}px`;
        this.eGui.style.top = `${rect.bottom + 2}px`;
        
        this.eInput.focus();
    }
    
    public hide(): void {
        this.eGui.style.display = "none";
        this.currentField = null;
    }
    
    public getGui(): HTMLElement {
        return this.eGui;
    }
    
    private handleApply(): void {
        if (this.currentField) {
            this.eventService.dispatchEvent("filterChanged", {
                field: this.currentField,
                searchTerm: this.eInput.value
            });
        }
        this.hide();
    }
    
    private handleClear(): void {
        if (this.currentField) {
            this.eventService.dispatchEvent("filterChanged", {
                field: this.currentField,
                searchTerm: ""
            });
        }
        this.hide();
    }
    
    public destroy(): void {
        this.eApplyBtn.removeEventListener("click", this.handleApply.bind(this));
        this.eClearBtn.removeEventListener("click", this.handleClear.bind(this));
        this.eGui.remove();
    }
}