import { Grid } from "./Grid";
import type { IRowData, GridOptions } from "./Interfaces";

interface GridRowData extends IRowData {
    id: number,
    name?: string,
    brand?: string,
    category?: string,
    quantity?: string,
    nutritionGrade?: string,
    ingredients?: string,
    allergens?: string,
    calories?: number,
    fat?: number,
    sugar?: number,
    countries?: string,
    barcode?: string
}

async function fetchProducts(page: number, limit: number = 100) {
    // OpenFoodFacts uses page_size instead of limit, and pages are 1-indexed
    const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=*&page=${page}&page_size=${limit}&json=true`
    );
    const data = await response.json();
    return {
        total: data.count, // Total results available
        page: data.page,
        pageSize: data.page_size,
        rows: data.products.map((product: any, index: number) => ({
            id: (page - 1) * limit + index,
            name: product.product_name || 'Unknown Product',
            brand: product.brands || 'Unknown Brand',
            category: product.categories_tags?.[0]?.replace('en:', '') || 'Uncategorized',
            quantity: product.quantity || 'N/A',
            nutritionGrade: product.nutrition_grades || 'N/A',
            ingredients: product.ingredients_text || '',
            allergens: product.allergens || 'None listed',
            calories: product.nutriments?.energy_100g || 0,
            fat: product.nutriments?.fat_100g || 0,
            sugar: product.nutriments?.sugars_100g || 0,
            countries: product.countries || 'Unknown',
            barcode: product.code
        }))
    };
}

const { total, page, pageSize, rows } = await fetchProducts(1, 100);

const gridOptions: GridOptions<GridRowData> = {
    columnDefs: [
        { field: "id", headerName: "ID", width: 60 },
        { field: "name", headerName: "Name", width: 180 },
        { field: "brand", headerName: "Brand", width: 180 },
        { field: "category", headerName: "Category", width: 180 },
        { field: "quantity", headerName: "Quantity", width: 100 },
        { field: "nutritionGrade", headerName: "Nutrition Grade", width: 120 },
        { field: "ingredients", headerName: "Ingredients", width: 180 },
        { field: "allergens", headerName: "Allergens", width: 160 },
        { field: "calories", headerName: "Calories", width: 120 },
        { field: "fat", headerName: "Fat", width: 80 },
        { field: "sugar", headerName: "Sugar", width: 80 },
        { field: "countries", headerName: "Countries", width: 180 },
        { field: "barcode", headerName: "Barcode", width: 120 },
    ],
    rowData: rows,
    rowHeight: 40,
    getRowHeightCallback: ({ data }) => {
        const ingredientsLength = data.ingredients?.length || 0;
        const nameLength = data.name?.length || 0;

        // Estimate characters per line for 180px column (~30-35 chars with padding)
        const charsPerLine = 35;
        const lineHeight = 35; // Approximate line height in pixels
        const padding = 14; // 5px top + 5px bottom

        // Calculate lines needed for ingredients (widest text field)
        const ingredientLines = Math.ceil(ingredientsLength / charsPerLine);
        const nameLines = Math.ceil(nameLength / charsPerLine);

        // Use the maximum lines needed
        const maxLines = Math.max(ingredientLines, nameLines, 1);

        // Calculate height with minimum of 40px
        return Math.max(40, (maxLines * lineHeight) + padding);
    }
};


const eGridDiv = document.querySelector<HTMLElement>('#grid-container')!;
new Grid<GridRowData>(eGridDiv, gridOptions);