import { BaseDemo } from "../BaseDemo";
import type { DemoInfo } from "../BaseDemo";
import type { GridOptions } from "../../Interfaces";
import type { GridRowData } from "./openfood-types";
import { fetchProducts } from "./openfood-data";

export class OpenFoodDemo extends BaseDemo<GridRowData> {
    getInfo(): DemoInfo {
        return {
            id: 'openfood',
            title: 'OpenFood Products Database',
            description: 'Browse 100 food products with nutrition information from Open Food Facts API. Features dynamic row heights based on content.',
            category: 'data-sources',
            tags: ['nutrition', 'api', 'dynamic-height', 'online'],
            dataSourceCredits: {
                name: 'Open Food Facts',
                url: 'https://world.openfoodfacts.org',
                description: 'Open database of food products from around the world'
            }
        };
    }

    async getGridOptions(): Promise<GridOptions<GridRowData>> {
        let rows: GridRowData[] = [];

        try {
            // Fetch data from Open Food Facts API
            const webFetch = (search: string, page: number, limit: number) =>
                fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${search}&page=${page}&page_size=${limit}&json=true`)
                    .then(response => {
                        if (!response.ok) throw new Error(`API error: ${response.status}`);
                        return response.json();
                    });
            const result = await fetchProducts("taco", 1, 100, webFetch);
            rows = result.rows;
            console.log('Loaded data from Open Food Facts API');
        } catch (error) {
            console.error('Online API failed, falling back to mock data:', error);
        }

        return {
            columnDefs: [
                { field: "id", headerName: "ID", width: 70, expanded: false },
                { field: "name", headerName: "Name", width: 180, expanded: false },
                { field: "brand", headerName: "Brand", width: 180, expanded: false },
                { field: "category", headerName: "Category", width: 180, expanded: false },
                { field: "quantity", headerName: "Quantity", width: 130, expanded: false },
                { field: "nutritionGrade", headerName: "Nutrition Grade", width: 140, expanded: false },
                { field: "ingredients", headerName: "Ingredients", width: 300, expanded: false },
                { field: "allergens", headerName: "Allergens", width: 160, expanded: false },
                { field: "calories", headerName: "Calories", width: 120, expanded: false },
                { field: "fat", headerName: "Fat", width: 80, expanded: false },
                { field: "sugar", headerName: "Sugar", width: 100, expanded: false },
                { field: "countries", headerName: "Countries", width: 180, expanded: false },
                { field: "barcode", headerName: "Barcode", width: 130, expanded: false },
            ],
            rowData: rows,
            rowHeight: 50,
            getRowHeightCallback: ({ data }) => {
                const ingredientsLength = data.ingredients?.length || 0;
                // Estimated characters per line for 300px column (~55-60 chars with padding)
                const charsPerLine = 55;
                const lineHeight = 30;
                const padding = 14;
                const ingredientLines = Math.ceil(ingredientsLength / charsPerLine);
                return Math.max(40, (ingredientLines * lineHeight) + padding);
            }
        };
    }
}
