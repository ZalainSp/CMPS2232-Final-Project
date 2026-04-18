import { MenuItem } from "./MenuItem";

export abstract class DrinkItemDef extends MenuItem {
    protected cupSize!: string;

    abstract getCupSize(): string;
    abstract setCupSize(size: string): void;
}

export class DrinkItem extends DrinkItemDef {
    constructor(
        itemID: number,
        itemName: string,
        basePrice: number,
        available: boolean,
        cupSize: string
    ) {
        super(itemID, itemName, basePrice, available);
        this.cupSize = cupSize;
    }

    getPrice(): number { return this.basePrice; }
    getDescription(): string { return `${this.itemName} (${this.cupSize}) - $${this.basePrice.toFixed(2)}`; }
    getCupSize(): string { return this.cupSize; }
    setCupSize(size: string): void { this.cupSize = size; }

    static async getAll() {
        
    }

    static async getById(itemID: number) {
        
    }

    static async add(itemName: string, basePrice: number, available: boolean, cupSize: string) {
        
    }

    static async updateCupSize(itemID: number, cupSize: string) {
        
    }
}