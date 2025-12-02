import type { ColumnDef, IRowData } from "../Interfaces";
import type { GridContext } from "../GridContext";
import type { GroupNode } from "../RowModel";

/**
 * Context object passed to cell renderers for accessing additional information.
 * This can be extended with custom properties based on the cell type.
 */
export interface ICellRendererContext {
    [key: string]: any;
}

/**
 * Specialized context for group cell renderers.
 * Contains the group node and Grid context for accessing services.
 */
export interface IGroupCellRendererContext<TRowData extends IRowData> extends ICellRendererContext {
    groupNode: GroupNode<TRowData>;
    gridContext: GridContext;
}

/**
 * Parameters passed to cell renderer methods for rendering cells.
 */
export interface ICellRendererParams<TRowData> {
    value: any; // TODO: Add proper type
    data: TRowData | null;
    field: keyof TRowData;
    rowIndex: number;
    columnDef: ColumnDef<TRowData>;
    eParent: HTMLElement;
    context?: ICellRendererContext;
}

/**
 * Interface for cell renderers.
 * Cell renderers are responsible for creating and managing cell DOM elements.
 */
export interface ICellRenderer<TRowData = any> {
    init(context?: GridContext): void;
    getGui(): HTMLElement;
    refresh(params: ICellRendererParams<TRowData>): boolean;
    destroy(): void;
}