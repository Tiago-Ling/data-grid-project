import type { RowHeightCallback } from "./RowModel";

export interface ColumnDef<TRowData = any> {
    field: keyof TRowData;
    headerName: string;
    width?: number;
    expanded?: boolean;
}

export interface GridOptions<TRowData extends IRowData> {
    rowData: TRowData[];
    columnDefs: ColumnDef<TRowData>[];
    rowHeight?: number; // Default 40
    getRowHeightCallback?: RowHeightCallback<TRowData>;
    onGridReady?: (api: any) => void;
}

export interface IRowData {
    id: number;
}

export interface ICellData<TRowData = any> {
    field: keyof TRowData;
    element: HTMLElement;
}

export interface ScrollChangedEvent {
    scrollTop: number | null;
    scrollLeft: number | null;
}