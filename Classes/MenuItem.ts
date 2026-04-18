export abstract class MenuItemDef {
    protected itemID!: number;
    protected itemName!: string;
    protected basePrice!: number;
    protected available!: boolean;

    abstract getPrice(): number;
    abstract getDescription(): string;

    abstract getItemID(): number;
    abstract getItemName(): string;
    abstract isAvailable(): boolean;
    abstract setBasePrice(price: number): void;
    abstract toggleAvailability(): void;
}

export class MenuItem extends MenuItemDef {
    constructor(
        itemID: number,
        itemName: string,
        basePrice: number,
        available: boolean
    ) {
        super();
        this.itemID = itemID;
        this.itemName = itemName;
        this.basePrice = basePrice;
        this.available = available;
    }

    getPrice(): number { return this.basePrice; }
    getDescription(): string { return `${this.itemName} - $${this.basePrice.toFixed(2)}`; }
    getItemID(): number { return this.itemID; }
    getItemName(): string { return this.itemName; }
    isAvailable(): boolean { return this.available; }
    setBasePrice(price: number): void { this.basePrice = price; }
    toggleAvailability(): void { this.available = !this.available; }

    static async getAll() {
        
    }

    static async getById(itemID: number) {
        
    }

    static async updatePrice(itemID: number, basePrice: number) {
        
    }

    static async toggleAvailability(itemID: number) {
        
    }

    static async delete(itemID: number) {
        
    }
}