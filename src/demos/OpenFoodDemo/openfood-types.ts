import type { IRowData } from "../../Interfaces";

export interface GridRowData extends IRowData {
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
