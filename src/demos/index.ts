import { OpenFoodDemo } from './OpenFoodDemo/OpenFoodDemo';
import { MotorbikeDemo } from './MotorbikeDemo/MotorbikeDemo';

export { BaseDemo, type DemoInfo } from './BaseDemo';

export const DEMO_REGISTRY = [
    new OpenFoodDemo(),
    new MotorbikeDemo(),
];
