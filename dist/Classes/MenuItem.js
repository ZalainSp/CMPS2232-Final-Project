"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItem = exports.MenuItemDef = void 0;
class MenuItemDef {
}
exports.MenuItemDef = MenuItemDef;
class MenuItem extends MenuItemDef {
    constructor(itemID, itemName, basePrice, available) {
        super();
        this.itemID = itemID;
        this.itemName = itemName;
        this.basePrice = basePrice;
        this.available = available;
    }
    getPrice() { return this.basePrice; }
    getDescription() { return `${this.itemName} - $${this.basePrice.toFixed(2)}`; }
    getItemID() { return this.itemID; }
    getItemName() { return this.itemName; }
    isAvailable() { return this.available; }
    setBasePrice(price) { this.basePrice = price; }
    toggleAvailability() { this.available = !this.available; }
    static async getAll() {
    }
    static async getById(itemID) {
    }
    static async updatePrice(itemID, basePrice) {
    }
    static async toggleAvailability(itemID) {
    }
    static async delete(itemID) {
    }
}
exports.MenuItem = MenuItem;
