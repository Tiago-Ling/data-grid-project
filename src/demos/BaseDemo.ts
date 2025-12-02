import { Grid } from "../Grid";
import type { IRowData, GridOptions } from "../Interfaces";

export interface DemoInfo {
    id: string;
    title: string;
    description: string;
    category?: 'data-sources' | 'features' | 'performance' | 'examples';
    tags?: string[];
    dataSourceCredits?: {
        name: string;
        url: string;
        description?: string;
    };
}

export abstract class BaseDemo<TRowData extends IRowData> {
    protected grid: Grid<TRowData> | null = null;
    protected container: HTMLElement | null = null;

    abstract getInfo(): DemoInfo;
    abstract getGridOptions(): Promise<GridOptions<TRowData>>;

    async init(container: HTMLElement): Promise<void> {
        if (this.grid) {
            this.grid.destroy();
            this.grid = null;
        }

        this.container = container;
        const options = await this.getGridOptions();
        this.grid = new Grid<TRowData>(container, options);
    }

    destroy(): void {
        if (this.grid) {
            this.grid.destroy();
            this.grid = null;
        }
        this.container = null;
    }
}
