import type { IRowData } from "../../Interfaces";

export interface GridRowData extends IRowData {
    id: number;
    brand?: string;
    model?: string;
    year?: number;
    category?: string;
    rating?: number;
    displacement?: number;
    power?: number;
    torque?: number;
    engine_cylinder?: string;
    engine_stroke?: string;
    gearbox?: string;
    bore?: number;
    stroke?: number;
    fuel_capacity?: number;
    fuel_system?: string;
    fuel_control?: string;
    cooling_system?: string;
    transmission_type?: string;
    dry_weight?: number;
    wheelbase?: number;
    seat_height?: number;
    front_brakes?: string;
    rear_brakes?: string;
    front_tire?: string;
    rear_tire?: string;
    front_suspension?: string;
    color_options?: string;
}