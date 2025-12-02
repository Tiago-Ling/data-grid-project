import type { GridOptions } from "../../Interfaces";
import { BaseDemo, type DemoInfo } from "../BaseDemo";
import type { GridRowData } from "./motorbike-types";
import { loadMotorbikeData } from "./motorbike-data";

export class MotorbikeDemo extends BaseDemo<GridRowData> {
    getInfo(): DemoInfo {
        return {
            id: 'motorbikes',
            title: 'Motorcycle Database',
            description: 'Browse 39,420 motorcycles with detailed specifications from Bikez.com (showing first 5,000 for performance). Data loaded from local CSV file.',
            category: 'data-sources',
            tags: ['motorcycles', 'specifications', 'large-dataset', 'offline', 'csv'],
            dataSourceCredits: {
                name: 'Bikez.com',
                url: 'https://bikez.com',
                description: 'Comprehensive motorcycle specifications database'
            }
        };
    }

    async getGridOptions(): Promise<GridOptions<GridRowData>> {
        // TODO: Add UI controls to allow users to change limit
        const rows = await loadMotorbikeData(5000);

        return {
            columnDefs: [
                // Primary identification
                { field: "brand", headerName: "Brand", width: 150, expanded: false },
                { field: "model", headerName: "Model", width: 200, expanded: false },
                { field: "year", headerName: "Year", width: 100, expanded: false },
                { field: "category", headerName: "Category", width: 190, expanded: false },

                // Key specifications
                { field: "rating", headerName: "Rating", width: 110, expanded: false },
                { field: "power", headerName: "Power (hp)", width: 120, expanded: false },
                { field: "torque", headerName: "Torque (Nm)", width: 130, expanded: false },
                { field: "displacement", headerName: "Displacement (ccm)", width: 170, expanded: false },
                { field: "dry_weight", headerName: "Weight (kg)", width: 120, expanded: false },

                // Engine details
                { field: "engine_cylinder", headerName: "Engine Cylinder", width: 190, expanded: false },
                { field: "engine_stroke", headerName: "Engine Stroke", width: 140, expanded: false },
                { field: "gearbox", headerName: "Gearbox", width: 130, expanded: false },
                { field: "bore", headerName: "Bore (mm)", width: 110, expanded: false },
                { field: "stroke", headerName: "Stroke (mm)", width: 120, expanded: false },

                // Fuel system
                { field: "fuel_capacity", headerName: "Fuel Cap. (L)", width: 140, expanded: false },
                { field: "fuel_system", headerName: "Fuel System", width: 180, expanded: false },
                { field: "fuel_control", headerName: "Fuel Control", width: 170, expanded: false },
                { field: "cooling_system", headerName: "Cooling", width: 130, expanded: false },

                // Transmission
                { field: "transmission_type", headerName: "Transmission", width: 170, expanded: false },

                // Dimensions
                { field: "wheelbase", headerName: "Wheelbase (mm)", width: 140, expanded: false },
                { field: "seat_height", headerName: "Seat Height (mm)", width: 160, expanded: false },

                // Brakes & Tires
                { field: "front_brakes", headerName: "Front Brakes", width: 140, expanded: false },
                { field: "rear_brakes", headerName: "Rear Brakes", width: 160, expanded: false },
                { field: "front_tire", headerName: "Front Tire", width: 110, expanded: false },
                { field: "rear_tire", headerName: "Rear Tire", width: 110, expanded: false },

                // Suspension
                { field: "front_suspension", headerName: "Front Suspension", width: 200, expanded: false },

                // Appearance
                { field: "color_options", headerName: "Colors", width: 150, expanded: false },
            ],
            rowData: rows,
            rowHeight: 40,
            getRowHeightCallback: ({ data }) => {
                const suspensionLength = data.front_suspension?.length || 0;
                const fuelSystemLength = data.fuel_system?.length || 0;

                // Estimated characters per line for 180px column (~30-35 chars with padding)
                const charsPerLine = 30;
                const lineHeight = 36;
                const padding = 14;
                const suspensionLines = Math.ceil(suspensionLength / charsPerLine);
                const fuelSystemLines = Math.ceil(fuelSystemLength / charsPerLine);
                const maxLines = Math.max(suspensionLines, fuelSystemLines, 1);
                return Math.max(40, (maxLines * lineHeight) + padding);
            }
        };
    }
}
