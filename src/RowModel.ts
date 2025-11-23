import type { IRowData } from "./Interfaces";
import { EventService } from "./EventService";
import type { RowRenderData, RowRenderInfo } from "./RowRenderer";

export const SortDirection = {
    ASC: 'asc',
    DESC: 'desc',
    NONE: 'null'
} as const;
export type SortDirection = typeof SortDirection[keyof typeof SortDirection];

export interface SortModel {
    sorts: Array<{field: string, direction: SortDirection }>;
}

export interface FilterModel<TRowData extends IRowData> {
    filters: Map<keyof TRowData, (row: TRowData) => boolean>;
}

export interface ModelUpdatedEvent<TRowData extends IRowData> {
    rowData: TRowData[];
    filterModel: FilterModel<TRowData>;
    sortModel: SortModel;
}

export type RowHeightCallback<TRowData extends IRowData> = (params: {
    data: TRowData,
    index: number
}) => number;

export class RowModel<TRowData extends IRowData> {
    private readonly rowData: TRowData[] = [];
    private rowsToDisplay: TRowData[] = [];
    private eventService: EventService;

    private filterModel: FilterModel<TRowData>;
    private sortModel: SortModel;

    private getRowHeightCallback?: RowHeightCallback<TRowData>;
    private defaultRowHeight: number;
    private cachedRowPositions: number[] = [];
    private totalHeight: number = 0;

    constructor(rowData: TRowData[], eventService: EventService, rowHeight: number, getRowHeightCallback?: RowHeightCallback<TRowData>) {
        this.rowData = rowData || [];
        this.eventService = eventService;
        this.defaultRowHeight = rowHeight;
        this.getRowHeightCallback = getRowHeightCallback;
        this.rowsToDisplay = [...this.rowData];

        this.filterModel = {
            filters: new Map()
        };
        this.sortModel = {
            sorts: []
        };

        this.recalculatePositions();
        this.eventService.addEventListener('sortChanged', this.onSortChanged.bind(this));
        this.eventService.addEventListener('filterChanged', this.onFilterChanged.bind(this));
    }

    private applyTransformations() {
        let data = [...this.rowData];

        // Apply filters
        this.filterModel.filters.forEach((filterFn) => {
            data = data.filter(filterFn);
        });

        // Apply sort
        if (this.sortModel.sorts.length > 0) {
            data.sort((a, b) => {
                for (const { field, direction } of this.sortModel.sorts) {
                    const result = this.compareValues(a[field as keyof TRowData], b[field as keyof TRowData], direction);
                    if (result !== 0) return result;
                }
                // Ensure stable sort by using row id as tiebreaker
                return (a.id as number) - (b.id as number);
            });
        }

        // TODO: Apply grouping

        this.rowsToDisplay = data;
        this.recalculatePositions();
        const event: ModelUpdatedEvent<TRowData> = { rowData: data, filterModel: this.filterModel, sortModel: this.sortModel };
        this.eventService.dispatchEvent('modelUpdated', event);
    }

    public calculateRowRenderData(scrollTop: number, viewportHeight: number): RowRenderData<TRowData> {
        const startIndex = this.getRowIndexAtPixel(scrollTop);
        const endIndex = this.getRowIndexAtPixel(scrollTop + viewportHeight);

        const rows = new Map<number, RowRenderInfo<TRowData>>();
        for (let i = startIndex; i <= endIndex; i++) {
            const rowData = this.getRow(i);
            if (!rowData) continue;

            rows.set(i, {
                index: i,
                data: rowData,
                height: this.getRowHeight(i),
                position: this.getRowPosition(i)
            });
        }
        return { totalHeight: this.getTotalHeight(), rows };
    }

    public getRowCount(): number {
        return this.rowsToDisplay.length;
    }

    public getRow(index: number): TRowData {
        return this.rowsToDisplay[index];
    }

    public getRowData(): TRowData[] {
        return this.rowsToDisplay;
    }

    public onFilterChanged(event: { field: keyof TRowData, searchTerm: string }): void {
        if (!event.searchTerm || event.searchTerm.trim() === '') {
            this.filterModel.filters.delete(event.field);
        } else {
            this.filterModel.filters.set(event.field, (row) => {
                const value = String(row[event.field]);
                return value.toLowerCase().includes(event.searchTerm.toLowerCase());
            });
        }
        this.applyTransformations();
    }

    public groupRows(groupModel: any): void {
        // TODO: Implement "Group By"
    }

    private onSortChanged(event: { field: string, shiftKey: boolean }): void {
        const field = event.field;
        const existingIndex = this.sortModel.sorts.findIndex(s => s.field === field);

        if (event.shiftKey) {
            // Multi-column sorting
            if (existingIndex !== -1) {
                const current = this.sortModel.sorts[existingIndex];
                if (current.direction === SortDirection.ASC) {
                    this.sortModel.sorts[existingIndex].direction = SortDirection.DESC;
                } else {
                    this.sortModel.sorts.splice(existingIndex, 1);
                }
            } else {
                this.sortModel.sorts.push({ field, direction: SortDirection.ASC});
            }
        } else {
            // Single column sorting
            if (existingIndex === 0 && this.sortModel.sorts.length === 1) {
                const current = this.sortModel.sorts[0];
                if (current.direction === SortDirection.ASC) {
                    this.sortModel.sorts[0].direction = SortDirection.DESC;
                } else {
                    this.sortModel.sorts = [];
                }
            } else {
                this.sortModel.sorts = [{ field, direction: SortDirection.ASC }];
            }
        }
        this.applyTransformations();
    }

    private compareValues<T>(a: T, b: T, direction: SortDirection): number {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;

        let result = 0;
        if (typeof a === 'string' && typeof b === 'string') {
            result = a.localeCompare(b, undefined, { sensitivity: 'base' });
        } else if (typeof a === 'number' && typeof b === 'number') {
            result = a - b;
        } else if (a instanceof Date && b instanceof Date) {
            result = a.getTime() - b.getTime();
        } else if (typeof a === 'boolean' && typeof b === 'boolean') {
            result = (a === b) ? 0 : a ? 1 : -1;
        } else {
            // Compare values as strings (fallback)
            result = String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
        }

        return direction === SortDirection.DESC ? -result : result;
    }

    private recalculatePositions(): void {
        let position = 0;
        this.cachedRowPositions = [];

        for (let i = 0; i < this.rowsToDisplay.length; i++) {
            this.cachedRowPositions[i] = position;
            position += this.getRowHeight(i);
        }
        this.totalHeight = position;
    }

    public getRowHeight(index: number): number {
        if (this.getRowHeightCallback) {
            const data = this.rowsToDisplay[index];
            return this.getRowHeightCallback({ data, index });
        }
        return this.defaultRowHeight;
    }

    public getRowPosition(index: number): number {
        return this.cachedRowPositions[index] ?? 0;
    }

    public getTotalHeight(): number {
        return this.totalHeight;
    }

    public getRowIndexAtPixel(pixel: number): number {
        let low = 0;
        let high = this.cachedRowPositions.length - 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const rowTop = this.cachedRowPositions[mid];
            const rowBottom = rowTop + this.getRowHeight(mid);

            if (pixel >= rowTop && pixel < rowBottom) {
                return mid;
            } else if (pixel < rowTop) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return Math.max(0, Math.min(low, this.cachedRowPositions.length - 1));
    }
}