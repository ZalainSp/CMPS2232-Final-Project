"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboMeal = exports.ComboMealDef = void 0;
const MenuItem_1 = require("./MenuItem");
class ComboMealDef extends MenuItem_1.MenuItem {
}
exports.ComboMealDef = ComboMealDef;
class ComboMeal extends ComboMealDef {
    constructor(itemID, itemName, basePrice, available, discountAmount) {
        super(itemID, itemName, basePrice, available);
        this.discountAmount = discountAmount;
    }
    getPrice() { return Math.max(0, this.basePrice - this.discountAmount); }
    getDescription() { return `${this.itemName} (Combo) - $${this.getPrice().toFixed(2)} (Save $${this.discountAmount.toFixed(2)})`; }
    getDiscountAmount() { return this.discountAmount; }
    setDiscountAmount(amount) { this.discountAmount = amount; }
    calculateSavings() { return this.discountAmount; }
    static async getAll() {
    }
    static async getById(itemID) {
    }
    static async add(itemName, basePrice, available, discountAmount) {
    }
    static async updateDiscount(itemID, discountAmount) {
    }
}
exports.ComboMeal = ComboMeal;
