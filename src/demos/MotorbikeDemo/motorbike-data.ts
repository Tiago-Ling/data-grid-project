import { parseCSV } from './csv-parser';
import type { GridRowData } from './motorbike-types';
import csvFileUrl from './all_bikez_curated.csv?url';

export async function loadMotorbikeData(limit: number = 5000): Promise<GridRowData[]> {
    try {
        const result = await parseCSV<any>(csvFileUrl, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });

        if (result.errors.length > 0) {
            console.warn('CSV parsing warnings:', result.errors);
        }

        const rows = result.data
            .filter((row: any) => row.Brand && row.Model) // Filter invalid rows
            .map((row: any, index: number) => transformMotorbikeRow(row, index));

        if (rows.length === 0) {
            throw new Error('No valid motorcycle data found in CSV');
        }

        // Limit rows for performance
        const limitedRows = limit ? rows.slice(0, limit) : rows;
        console.log(`Loaded ${limitedRows.length} motorcycles from CSV (${rows.length} total)`);

        return limitedRows;
    } catch (error) {
        throw new Error(`Failed to load motorcycle data: ${(error as Error).message}`);
    }
}

function transformMotorbikeRow(row: any, index: number): GridRowData {
    return {
        id: index,
        brand: row.Brand || row.brand,
        model: row.Model || row.model,
        year: parseNumber(row.Year || row.year),
        category: row.Category || row.category,
        rating: parseNumber(row.Rating || row.rating),
        displacement: parseNumber(row['Displacement (ccm)'] || row.displacement),
        power: parseNumber(row['Power (hp)'] || row.power),
        torque: parseNumber(row['Torque (Nm)'] || row.torque),
        engine_cylinder: row['Engine cylinder'] || row.engine_cylinder,
        engine_stroke: row['Engine stroke'] || row.engine_stroke,
        gearbox: row.Gearbox || row.gearbox,
        bore: parseNumber(row['Bore (mm)'] || row.bore),
        stroke: parseNumber(row['Stroke (mm)'] || row.stroke),
        fuel_capacity: parseNumber(row['Fuel capacity (lts)'] || row.fuel_capacity),
        fuel_system: row['Fuel system'] || row.fuel_system,
        fuel_control: row['Fuel control'] || row.fuel_control,
        cooling_system: row['Cooling system'] || row.cooling_system,
        transmission_type: row['Transmission type'] || row.transmission_type,
        dry_weight: parseNumber(row['Dry weight (kg)'] || row.dry_weight),
        wheelbase: parseNumber(row['Wheelbase (mm)'] || row.wheelbase),
        seat_height: parseNumber(row['Seat height (mm)'] || row.seat_height),
        front_brakes: row['Front brakes'] || row.front_brakes,
        rear_brakes: row['Rear brakes'] || row.rear_brakes,
        front_tire: row['Front tire'] || row.front_tire,
        rear_tire: row['Rear tire'] || row.rear_tire,
        front_suspension: row['Front suspension'] || row.front_suspension,
        color_options: row['Color options'] || row.color_options
    };
}

function parseNumber(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return undefined;
        const parsed = parseFloat(trimmed);
        return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
}
