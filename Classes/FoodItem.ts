import { MenuItem } from "./MenuItem";

export abstract class FoodItemDef extends MenuItem {
    protected portionSize!: string;

    abstract getPortionSize(): string;
    abstract setPortionSize(size: string): void;
}

export class FoodItem extends FoodItemDef {
    constructor(
        itemID: number,
        itemName: string,
        basePrice: number,
        available: boolean,
        portionSize: string
    ) {
        super(itemID, itemName, basePrice, available);
        this.portionSize = portionSize;
    }

    getPrice(): number { return this.basePrice; }
    getDescription(): string { return `${this.itemName} (${this.portionSize}) - $${this.basePrice.toFixed(2)}`; }
    getPortionSize(): string { return this.portionSize; }
    setPortionSize(size: string): void { this.portionSize = size; }

    static async getAll() {
        
    }

    static async getById(itemID: number) {
        
    }

    static async add(itemName: string, basePrice: number, available: boolean, portionSize: string) {
        
    }

    static async updatePortionSize(itemID: number, portionSize: string) {
        
    }
}
