import type { EventService } from "../EventService";
import type { ColumnDef } from "../Interfaces";

export interface ICellRendererParams<TRowData> {
    value: any; // TODO: Add proper type
    data: TRowData | null;
    field: keyof TRowData;
    rowIndex: number;
    columnDef: ColumnDef<TRowData>;
    eParent: HTMLElement;
    context?: any; // TODO: Add proper type
}

export interface ICellRenderer<TRowData = any> {
    init(eventService?: EventService): void;
    getGui(): HTMLElement;
    refresh(params: ICellRendererParams<TRowData>): boolean;
    destroy(): void;
}