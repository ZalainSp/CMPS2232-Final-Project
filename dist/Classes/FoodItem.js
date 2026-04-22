"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodItem = exports.FoodItemDef = void 0;
const MenuItem_1 = require("./MenuItem");
class FoodItemDef extends MenuItem_1.MenuItem {
}
exports.FoodItemDef = FoodItemDef;
class FoodItem extends FoodItemDef {
    constructor(itemID, itemName, basePrice, available, portionSize) {
        super(itemID, itemName, basePrice, available);
        this.portionSize = portionSize;
    }
    getPrice() { return this.basePrice; }
    getDescription() { return `${this.itemName} (${this.portionSize}) - $${this.basePrice.toFixed(2)}`; }
    getPortionSize() { return this.portionSize; }
    setPortionSize(size) { this.portionSize = size; }
    static async getAll() {
    }
    static async getById(itemID) {
    }
    static async add(itemName, basePrice, available, portionSize) {
    }
    static async updatePortionSize(itemID, portionSize) {
    }
}
exports.FoodItem = FoodItem;
