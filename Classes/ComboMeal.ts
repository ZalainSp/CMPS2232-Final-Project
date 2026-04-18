import { MenuItem } from "./MenuItem";

export abstract class ComboMealDef extends MenuItem {
    protected discountAmount!: number;

    abstract getDiscountAmount(): number;
    abstract setDiscountAmount(amount: number): void;
    abstract calculateSavings(): number;
}

export class ComboMeal extends ComboMealDef {
    constructor(
        itemID: number,
        itemName: string,
        basePrice: number,
        available: boolean,
        discountAmount: number
    ) {
        super(itemID, itemName, basePrice, available);
        this.discountAmount = discountAmount;
    }

    getPrice(): number { return Math.max(0, this.basePrice - this.discountAmount); }
    getDescription(): string { return `${this.itemName} (Combo) - $${this.getPrice().toFixed(2)} (Save $${this.discountAmount.toFixed(2)})`; }
    getDiscountAmount(): number { return this.discountAmount; }
    setDiscountAmount(amount: number): void { this.discountAmount = amount; }
    calculateSavings(): number { return this.discountAmount; }

    static async getAll() {
        
    }

    static async getById(itemID: number) {
        
    }

    static async add(itemName: string, basePrice: number, available: boolean, discountAmount: number) {
      
    }

    static async updateDiscount(itemID: number, discountAmount: number) {
       
    }
}