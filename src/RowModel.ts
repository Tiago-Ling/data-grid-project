import type { ColumnDef, GridOptions, IRowData } from "./Interfaces";
import { EventService } from "./EventService";
import type { RowRenderData, RowRenderInfo } from "./RowRenderer";
import { DEF_ROW_HEIGHT } from "./Constants";

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

export interface GroupModel<TRowData extends IRowData> {
    groupBy: (keyof TRowData)[];
    expandedGroups: Set<string>;
}

export interface ModelUpdatedEvent<TRowData extends IRowData> {
    rowData: TreeNode<TRowData>[];
    filterModel: FilterModel<TRowData>;
    sortModel: SortModel;
}

export type RowHeightCallback<TRowData extends IRowData> = (params: {
    data: TRowData,
    index: number
}) => number;

export type NodeType = 'group' | 'row';

export interface GroupNode<TRowData extends IRowData> {
    type: NodeType;
    key: TRowData[keyof TRowData];
    field: keyof TRowData;
    level: number;
    expanded: boolean;
    children: TreeNode<TRowData>[];
    compositeKey: string;
    count?: number;
}

export interface RowNode<TRowData extends IRowData> {
    type: NodeType;
    data: TRowData;
    level: number;
}

export type TreeNode<TRowData extends IRowData> = GroupNode<TRowData> | RowNode<TRowData>;

export class RowModel<TRowData extends IRowData> {
    private readonly rowData: TRowData[] = [];
    private rowsToDisplay: TreeNode<TRowData>[] = [];
    private eventService: EventService;
    private colDefs: Map<keyof TRowData, ColumnDef<TRowData>>;

    private filterModel: FilterModel<TRowData>;
    private sortModel: SortModel;
    private groupModel: GroupModel<TRowData>;

    private getRowHeightCallback?: RowHeightCallback<TRowData>;
    private cachedRowPositions: number[] = [];
    private totalHeight: number = 0;

    constructor(gridOptions: GridOptions<TRowData>, eventService: EventService) {
        const { rowData, columnDefs, getRowHeightCallback } = gridOptions;
        this.rowData = rowData || [];
        this.eventService = eventService;
        this.colDefs = new Map(columnDefs.map(colDef => [colDef.field, colDef] as const));
        this.getRowHeightCallback = getRowHeightCallback;
        this.rowsToDisplay = this.rowData.map((value: TRowData) => ({
            type: 'row',
            data: value,
            level: 0
        }));

        this.filterModel = {
            filters: new Map()
        };
        this.sortModel = {
            sorts: []
        };
        this.groupModel = {
            groupBy: [],
            expandedGroups: new Set()
        };

        this.recalculatePositions();
        this.eventService.addEventListener('sortChanged', this.onSortChanged.bind(this));
        this.eventService.addEventListener('filterChanged', this.onFilterChanged.bind(this));
        this.eventService.addEventListener('groupByToggled', this.onGroupByToggled.bind(this));
        this.eventService.addEventListener('groupExpanded', this.toggleGroupExpansion.bind(this));
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

        // Apply grouping
        let rowNodes:TreeNode<TRowData>[] = [];
        if (this.groupModel.groupBy.length > 0) {
            rowNodes = this.buildGroupTree(data, this.groupModel, 0, '');
            rowNodes = this.flattenTree(rowNodes);
        } else {
            rowNodes = data.map((value: TRowData) => ({
                type: 'row',
                data: value,
                level: 0
            }));
        }

        this.rowsToDisplay = rowNodes;
        this.recalculatePositions();
        const event: ModelUpdatedEvent<TRowData> = { rowData: this.rowsToDisplay, filterModel: this.filterModel, sortModel: this.sortModel };
        this.eventService.dispatchEvent('modelUpdated', event);
    }

    public calculateRowRenderData(scrollTop: number, viewportHeight: number): RowRenderData<TRowData> {
        const startIndex = this.getRowIndexAtPixel(scrollTop);
        const endIndex = this.getRowIndexAtPixel(scrollTop + viewportHeight);

        const rows = new Map<number, RowRenderInfo<TRowData>>();
        for (let i = startIndex; i <= endIndex; i++) {
            const rowNode = this.getRow(i);
            if (!rowNode) continue;

            rows.set(i, {
                index: i,
                node: rowNode,
                height: this.getRowHeight(i),
                position: this.getRowPosition(i)
            });
        }
        return { totalHeight: this.getTotalHeight(), rows };
    }

    public getRowCount(): number {
        return this.rowsToDisplay.length;
    }

    public getRow(index: number): TreeNode<TRowData> {
        return this.rowsToDisplay[index];
    }

    public getRowData(): TreeNode<TRowData>[] {
        return this.rowsToDisplay;
    }

    private onFilterChanged(event: { field: keyof TRowData, searchTerm: string }): void {
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

    private onGroupByToggled(field: keyof TRowData): void {
        let toRemove = false;
        for (let i = 0; i < this.groupModel.groupBy.length; i++) {
            toRemove = field === this.groupModel.groupBy[i];
            if (toRemove) {
                this.groupModel.groupBy.splice(i, 1);
                // TODO: clear this
                // this.groupModel.expandedGroups.delete(field);
                break;
            }
        }

        if (!toRemove) {
            this.groupModel.groupBy.push(field);
        }
        this.applyTransformations();
    }

    private toggleGroupExpansion(event: { key: string }): void {
        const isExpanded = this.groupModel.expandedGroups.has(event.key);
        if (!isExpanded) {
            this.groupModel.expandedGroups.add(event.key);
        } else {
            this.groupModel.expandedGroups.delete(event.key);
        }
        this.applyTransformations();
    }

    private buildGroupTree(rows:TRowData[], groupModel: GroupModel<TRowData>, level: number = 0, parentPath: string = ''): TreeNode<TRowData>[] {
        // Base case
        if (level >= groupModel.groupBy.length) {
            return rows.map(value => ({
                type: 'row',
                data: value,
                level: level
            }));
        }
        const currentField = groupModel.groupBy[level];
        const defaultExpanded = this.colDefs.get(currentField)?.expanded ?? false;

        // Group rows according to groupBy field and its values
        const fieldBuckets = new Map<TRowData[keyof TRowData], TRowData[]>();
        for (const row of rows) {
            const fieldValue = row[currentField];
            if (!fieldBuckets.has(fieldValue)) {
                fieldBuckets.set(fieldValue, []);
            }
            fieldBuckets.get(fieldValue)!.push(row);
        }

        const groups: GroupNode<TRowData>[] = [];
        fieldBuckets.forEach((values: TRowData[], key:TRowData[keyof TRowData]) => {
            // Create unique key for the group and verify if it's expanded
            const groupPath = parentPath
                ? `${parentPath}/${currentField as string}_${key}`
                : `${currentField as string}_${key}_${level}`;

            const hasExplicitState = groupModel.expandedGroups.has(groupPath);
            const isExpanded = hasExplicitState || defaultExpanded;

            // Recurse over children
            const children = this.buildGroupTree(values, groupModel, level + 1, groupPath);
            const totalCount = children.reduce((sum, node) => node.type === 'row'
                ? sum + 1 : sum + ((node as GroupNode<TRowData>).count || 0), 0);

            const groupNode: GroupNode<TRowData> = {
                type: 'group' as NodeType,
                key: key,
                field: currentField,
                level: level,
                expanded: isExpanded,
                children: children,
                compositeKey: groupPath,
                count: totalCount // Total descendants
            };
            groups.push(groupNode);
        });
        return groups;
    }

    // Recursion would be simpler here, but iterating has slightly better memory usage,
    // no call stack overhead (although unlikely to happen here) and I get to practice
    // a different algo as well
    private flattenTree(nodes: TreeNode<TRowData>[]): TreeNode<TRowData>[] {
        const res: TreeNode<TRowData>[] = [];
        // Using stack for depth-first to match existing order
        const stack:TreeNode<TRowData>[] = [...nodes].reverse();
        while (stack.length > 0) {
            const node = stack.pop();
            if (!node) continue;
            res.push(node);
            if (node.type === 'group' && (node as GroupNode<TRowData>).expanded) {
                const group = node as GroupNode<TRowData>;
                for (let i = group.children.length - 1; i >= 0; i--) {
                    stack.push(group.children[i]);
                }
            }
        }
        return res;
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
            const node = this.rowsToDisplay[index];
            if (node.type === 'row') {
                const data = (node as RowNode<TRowData>).data;
                return this.getRowHeightCallback({ data, index });
            }
        }
        return DEF_ROW_HEIGHT;
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