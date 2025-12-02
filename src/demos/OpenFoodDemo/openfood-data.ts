export async function fetchProducts(search: string, page: number, limit: number = 100, fetchFunction: (search:string, page: number, limit: number) => Promise<any>) {
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
