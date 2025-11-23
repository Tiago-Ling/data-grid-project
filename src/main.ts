import { Grid } from "./Grid";
import type { IRowData, GridOptions } from "./Interfaces";

interface GridRowData extends IRowData {
    make?: string;
    model?: string;
    color?: string;
    year?: number;
    mileage?: number;
    price?: number;
    condition?: string;
    notes?:string;
}

// Quick-and-dirty dummy data for testing (TODO: update asap)
function createRowData(count: number) {
    const data: GridRowData[] = [];
    for (let i = 0; i < count; i++) {
        data.push({
            id: i,
            make: i % 3 === 0 ? "Toyota" : i % 3 === 1 ? "Ford" : "Porsche",
            model: "Model " + Math.floor(Math.random() * 1000),
            color: i % 3 === 0 ? "Red" : i % 3 === 1 ? "Blue" : "Silver",
            year: i % 3 === 0 ? 2015 : i % 3 === 1 ? 2025 : 2005,
            mileage: Math.floor(Math.random() * 100000),
            price: Math.floor(Math.random() * 100000),
            condition: i % 3 === 0 ? "New" : i % 3 === 1 ? "Used, Good" : "Used, Bad",
            notes: i % 3 === 0
                ? "Great car in great condition, must see!" : i % 3 === 1
                ? "The car has seen better days, but is very reliable"
                : "Only buy if you are looking to use it for part exchange",
        });
    }
    return data;
}

const gridOptions: GridOptions<GridRowData> = {
    columnDefs: [
        { field: "id", headerName: "ID", width: 80 },
        { field: "make", headerName: "Make", width: 120 },
        { field: "model", headerName: "Model", width: 120 },
        { field: "color", headerName: "Color", width: 100 },
        { field: "year", headerName: "Year", width: 100 },
        { field: "price", headerName: "Price", width: 100 },
        { field: "condition", headerName: "Condition", width: 120 },
        { field: "notes", headerName: "Notes", width: 400 }
    ],
    rowData: createRowData(10000),
    rowHeight: 40,
};

const eGridDiv = document.querySelector<HTMLElement>('#grid-container')!;
new Grid<GridRowData>(eGridDiv, gridOptions);