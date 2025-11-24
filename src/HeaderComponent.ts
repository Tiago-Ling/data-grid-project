import type { EventService } from "./EventService";
import type { ColumnDef, IRowData } from "./Interfaces";
import { SortDirection, type SortModel } from "./RowModel";

export class HeaderComponent<TRowData extends IRowData> {
    private headerElement: HTMLElement;
    private viewport: HTMLElement;
    private eventService: EventService;
    private resizeObserver: ResizeObserver | null = null;
    private onHeaderCellClicked: ((event: MouseEvent) => void) | null = null;
    private activeFilters: Map<string, string>;

    constructor(headerElement:HTMLElement, viewport: HTMLElement, eventService: EventService) {
        this.headerElement = headerElement;
        this.viewport = viewport;
        this.eventService = eventService;
        this.activeFilters = new Map<string, string>();
    }

    public init(colDefs: ColumnDef<TRowData>[], totalWidth: number) {
        this.headerElement.innerHTML = '';

        const headerInner = document.createElement('div');
        headerInner.style.width = `${totalWidth}px`;
        headerInner.style.display = 'flex';

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < colDefs.length; i++) {
            const col = colDefs[i];
            const cell = document.createElement('div');
            cell.className = 'header-cell';
            cell.style.width = cell.style.minWidth = `${col.width}px`;
            cell.style.cursor = 'pointer';
            cell.dataset.field = col.field as string;

            const textSpan = document.createElement('span');
            textSpan.textContent = col.headerName;

            const sortSpan = document.createElement('span');
            sortSpan.className = 'sort-indicator';

            // Quick and dirty inline SVG
            const filterIconSvg = `<svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M1 2h14l-6 8v4l-2-1V10L1 2z" fill="currentColor"/></svg>`;

            const filterSpan = document.createElement('span');
            filterSpan.className = 'filter-indicator';
            filterSpan.innerHTML = filterIconSvg;

            const headerMenuSvg = `<svg width="800px" height="800px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#000000" class="bi bi-three-dots-vertical">
                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                </svg>`;
            const headerMenu = document.createElement('span');
            headerMenu.className = 'header-menu';
            headerMenu.innerHTML = headerMenuSvg;

            cell.appendChild(textSpan);
            cell.appendChild(sortSpan);
            cell.appendChild(filterSpan);
            cell.appendChild(headerMenu);

            fragment.appendChild(cell);
        }

        headerInner.appendChild(fragment);
        this.headerElement.appendChild(headerInner);

        this.setupScrollbarPadding();
        this.setupHandlers(headerInner);
    }

    private setupHandlers(headerInner: HTMLElement): void {
        if (this.onHeaderCellClicked) {
            const prevInner = this.headerElement.querySelector('div');
            if (prevInner) {
                prevInner.removeEventListener('click', this.onHeaderCellClicked);
            }
        }

        this.onHeaderCellClicked = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const headerCell = target.closest('.header-cell') as HTMLElement;
            const field = headerCell?.dataset.field;

            // 3-dot menu (triggering Group By for now, for testing)
            if (target.classList.contains('header-menu') || target.closest('.header-menu')) {
                if (field) {
                    this.handleGroupByClick(field);
                }
                event.stopPropagation();
                return;
            }

            // Filtering
            if (target.classList.contains('filter-indicator') || target.closest('.filter-indicator')) {
                if (field) {
                    this.handleFilterClick(field, headerCell);
                }
                event.stopPropagation();
                return;
            }

            // Sorting
            if (headerCell) {
                const field = headerCell.dataset.field;
                if (field) {
                    this.eventService.dispatchEvent('sortChanged', { field, shiftKey: event.shiftKey });
                }
                event.stopPropagation();
                return;
            }
        }
        headerInner.addEventListener('click', this.onHeaderCellClicked.bind(this));
    }

    private handleGroupByClick(field: string): void {
        this.eventService.dispatchEvent('groupByToggled', field);
    }

    private handleFilterClick(field: string, headerCell: HTMLElement): void {
        this.hideFilterPopover();
        
        const popover = document.createElement('div');
        popover.className = 'filter-popover';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Search ${field}...`;
        input.className = 'filter-input';
        input.value = this.activeFilters.get(field) || '';

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'filter-buttons';

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply';
        applyBtn.className = 'filter-apply-btn';
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.className = 'filter-clear-btn';

        buttonsContainer.appendChild(applyBtn);
        buttonsContainer.appendChild(clearBtn);
        
        popover.appendChild(input);
        popover.appendChild(buttonsContainer);

        document.body.appendChild(popover);

        const rect = headerCell.getBoundingClientRect();
        popover.style.position = 'fixed';
        popover.style.top = `${rect.bottom + 4}px`;
        popover.style.left = `${rect.left}px`;
        
        input.focus();
        input.select(); // For existing text in active filters

        const onApplyFilter = () => {
            const value = input.value.trim();
            if (value) {
                this.applyFilter(field, value);
            }
            this.hideFilterPopover();
        }
        applyBtn.addEventListener('click', onApplyFilter);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onApplyFilter();
            } else if (e.key === 'Escape') {
                this.hideFilterPopover();
            }
        });
        
        let timeout: number;
        input.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const searchTerm = (e.target as HTMLInputElement).value;
                this.applyFilter(field, searchTerm);
            }, 300); // TODO: Extract default debounce interval
        });
        
        clearBtn.addEventListener('click', () => {
            this.clearFilter(field);
            this.hideFilterPopover();
        });
        
        // Auto-close when clicking outside popover
        setTimeout(() => {
            document.addEventListener('click', this.onDocumentClick.bind(this), { once: true });
        }, 0);
    }

    private hideFilterPopover(): void {
        const existing = document.querySelector('.filter-popover');
        if (existing) {
            existing.remove();
        }
    }

    private applyFilter(field: string, searchTerm: string): void {
        if (searchTerm) {
            this.activeFilters.set(field, searchTerm);
            this.updateFilterIndicator(field, true);
        }
        this.eventService.dispatchEvent('filterChanged', { field: field, searchTerm: searchTerm });
    }

    private clearFilter(field: string): void {
        this.activeFilters.delete(field);
        this.updateFilterIndicator(field, false);
        this.eventService.dispatchEvent('filterChanged', { field, searchTerm: '' });
    }

    private updateFilterIndicator(field: string, isActive: boolean): void {
        const headerCell = this.headerElement.querySelector(`[data-field=${field}]`) as HTMLElement;
        if (!headerCell) return;

        const filterIndicator = headerCell.querySelector('.filter-indicator');
        if (filterIndicator) {
            if (isActive) {
                filterIndicator.classList.add('filter-active');
            } else {
                filterIndicator.classList.remove('filter-active');
            }
        }
    }

    private onDocumentClick(event: MouseEvent): void {
        const popover = document.querySelector('.filter-popover');
        if (popover && !popover.contains(event.target as Node)) {
            this.hideFilterPopover();
        }
    }

    public updateSortIndicators(sortModel: SortModel): void {
        // Clear indicators
        const allCells = this.headerElement.querySelectorAll('.header-cell');
        allCells.forEach(cell => {
            const indicator = cell.querySelector('.sort-indicator');
            if (indicator) {
                indicator.textContent = '';
                cell.classList.remove('sort-asc', 'sort-desc');
            }
        });

        sortModel.sorts.forEach((sort, index) => {
            const cell = this.headerElement.querySelector(`[data-field="${sort.field}"]`);
            if (cell) {
                const indicator = cell.querySelector('.sort-indicator');
                if (indicator) {
                    const orderNumber = sortModel.sorts.length > 1 ? `${index + 1}` : '';
                    indicator.textContent = this.getSortIndicator(sort.direction, orderNumber);
                    cell.classList.add(sort.direction === SortDirection.ASC ? 'sort-asc' : 'sort-desc');
                }
            }
        });
    }

    private getSortIndicator(direction: SortDirection, orderNumber: string): string {
        if (direction === SortDirection.ASC) return `↑${orderNumber}`;
        if (direction === SortDirection.DESC) return `↓${orderNumber}`;
        return '';
    }

    public syncScroll(scrollLeft: number): void {
        if (this.headerElement.scrollLeft !== scrollLeft) {
            this.headerElement.scrollLeft = scrollLeft;
        }
    }

    private setupScrollbarPadding() {
        const scrollbarWidth = this.viewport.offsetWidth - this.viewport.clientWidth;
        this.headerElement.style.paddingRight = `${scrollbarWidth}px`;

        this.resizeObserver = new ResizeObserver(() => {
            const newScrollbarWidth = this.viewport.offsetWidth - this.viewport.clientWidth;
            this.headerElement.style.paddingRight = `${newScrollbarWidth}px`;
        });

        this.resizeObserver.observe(this.viewport);
    }

    public destroy(): void {
        if (this.onHeaderCellClicked) {
            const headerInner = this.headerElement.querySelector('div');
            if (headerInner) {
                headerInner.removeEventListener('click', this.onHeaderCellClicked);
            }
            this.onHeaderCellClicked = null;
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
}