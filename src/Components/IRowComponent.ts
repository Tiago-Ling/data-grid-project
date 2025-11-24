import type { RowRenderInfo } from "../RowRenderer";
import type { IRowData } from "../Interfaces";

export interface IRowComponent<TRowData extends IRowData> {
    setData(renderInfo: RowRenderInfo<TRowData>): void;
    getGui(): HTMLElement;
    getType(): string;
    destroy(): void;
}