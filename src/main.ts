import { Grid } from "./Grid";
import type { IRowData, GridOptions } from "./Interfaces";
// import jsonData from "../openfood_page_1_limit_100.json";

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

async function fetchProducts(search: string, page: number, limit: number = 100, fetchFunction: (search:string, page: number, limit: number) => Promise<any>) {
    // let data = fetchFunction ? await fetchFunction(search, page, limit) : jsonData;
    let data = await fetchFunction(search, page, limit);
    return {
        total: data.count, // Total results available
        page: data.page,
        pageSize: data.page_size,
        rows: data.products.map((product: any, index: number) => ({
            id: (page - 1) * limit + index,
            name: product.product_name || "Unknown Product",
            brand: product.brands || "Unknown Brand",
            category: product.categories_tags?.[0]?.replace("en:", "") || "Uncategorized",
            quantity: product.quantity || "N/A",
            nutritionGrade: product.nutrition_grades || "N/A",
            ingredients: product.ingredients_text || "",
            allergens: product.allergens || "None listed",
            calories: product.nutriments?.energy_100g || 0,
            fat: product.nutriments?.fat_100g || 0,
            sugar: product.nutriments?.sugars_100g || 0,
            countries: product.countries || "Unknown",
            barcode: product.code
        }))
    };
}

// Grab the data from the web
const webFetch = (search: string, page: number, limit: number) =>
    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${search}&page=${page}&page_size=${limit}&json=true`).then(response => response.json());
const { rows } = await fetchProducts("pasta", 1, 100, webFetch);

// For local testing without abusing Open Food Facts' API
// const { rows } = await fetchProducts("pasta", 1, 100);

const gridOptions: GridOptions<GridRowData> = {
    columnDefs: [
        { field: "id", headerName: "ID", width: 60, expanded: false },
        { field: "name", headerName: "Name", width: 180, expanded: false },
        { field: "brand", headerName: "Brand", width: 180, expanded: false },
        { field: "category", headerName: "Category", width: 180, expanded: false },
        { field: "quantity", headerName: "Quantity", width: 100, expanded: false },
        { field: "nutritionGrade", headerName: "Nutrition Grade", width: 120, expanded: false },
        { field: "ingredients", headerName: "Ingredients", width: 180, expanded: false },
        { field: "allergens", headerName: "Allergens", width: 160, expanded: false },
        { field: "calories", headerName: "Calories", width: 120, expanded: false },
        { field: "fat", headerName: "Fat", width: 80, expanded: false },
        { field: "sugar", headerName: "Sugar", width: 80, expanded: false },
        { field: "countries", headerName: "Countries", width: 180, expanded: false },
        { field: "barcode", headerName: "Barcode", width: 120, expanded: false },
    ],
    rowData: rows,
    rowHeight: 40,
    getRowHeightCallback: ({ data }) => {
        const ingredientsLength = data.ingredients?.length || 0;
        const nameLength = data.name?.length || 0;

        // Estimated characters per line for 180px column (~30-35 chars with padding)
        const charsPerLine = 35;
        const lineHeight = 35;
        const padding = 14;
        const ingredientLines = Math.ceil(ingredientsLength / charsPerLine);
        const nameLines = Math.ceil(nameLength / charsPerLine);
        const maxLines = Math.max(ingredientLines, nameLines, 1);
        return Math.max(40, (maxLines * lineHeight) + padding);
    }
};


const eGridDiv = document.querySelector<HTMLElement>("#grid-container")!;
new Grid<GridRowData>(eGridDiv, gridOptions);