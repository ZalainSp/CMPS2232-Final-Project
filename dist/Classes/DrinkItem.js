"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrinkItem = exports.DrinkItemDef = void 0;
const MenuItem_1 = require("./MenuItem");
class DrinkItemDef extends MenuItem_1.MenuItem {
}
exports.DrinkItemDef = DrinkItemDef;
class DrinkItem extends DrinkItemDef {
    constructor(itemID, itemName, basePrice, available, cupSize) {
        super(itemID, itemName, basePrice, available);
        this.cupSize = cupSize;
    }
    getPrice() {
        return this.basePrice;
    }
    getDescription() {
        return `${this.itemName} (${this.cupSize}) - $${this.basePrice.toFixed(2)}`;
    }
    getCupSize() {
        return this.cupSize;
    }
    setCupSize(size) {
        this.cupSize = size;
    }
    static async getAll() { }
    static async getById(itemID) { }
    static async add(itemName, basePrice, available, cupSize) { }
    static async updateCupSize(itemID, cupSize) { }
}
exports.DrinkItem = DrinkItem;
