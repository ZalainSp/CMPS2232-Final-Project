"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItem = exports.MenuItemDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
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
    getPrice() {
        return this.basePrice;
    }
    getDescription() {
        return `${this.itemName} - $${this.basePrice.toFixed(2)}`;
    }
    getItemID() {
        return this.itemID;
    }
    getItemName() {
        return this.itemName;
    }
    isAvailable() {
        return this.available;
    }
    setBasePrice(price) {
        this.basePrice = price;
    }
    toggleAvailability() {
        this.available = !this.available;
    }
    static async getAll() {
        const query = `
            SELECT
                mi.itemID AS "itemID",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                mi.isAvailable AS "isAvailable",
                CASE
                    WHEN fi.itemID IS NOT NULL THEN 'food'
                    WHEN di.itemID IS NOT NULL THEN 'drink'
                    WHEN cm.itemID IS NOT NULL THEN 'combo'
                    ELSE 'item'
                END AS type,
                fi.portionSize AS "portionSize",
                di.cupSize AS "cupSize",
                cm.discountAmount AS "discountAmount"
            FROM MenuItem mi
            LEFT JOIN FoodItem fi ON mi.itemID = fi.itemID
            LEFT JOIN DrinkItem di ON mi.itemID = di.itemID
            LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
            ORDER BY mi.itemName ASC;
        `;
        const result = await dbConnection_1.default.query(query);
        return result.rows;
    }
    static async getById(itemID) {
        const query = `
            SELECT
                mi.itemID AS "itemID",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                mi.isAvailable AS "isAvailable",
                CASE
                    WHEN fi.itemID IS NOT NULL THEN 'food'
                    WHEN di.itemID IS NOT NULL THEN 'drink'
                    WHEN cm.itemID IS NOT NULL THEN 'combo'
                    ELSE 'item'
                END AS type,
                fi.portionSize AS "portionSize",
                di.cupSize AS "cupSize",
                cm.discountAmount AS "discountAmount"
            FROM MenuItem mi
            LEFT JOIN FoodItem fi ON mi.itemID = fi.itemID
            LEFT JOIN DrinkItem di ON mi.itemID = di.itemID
            LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
            WHERE mi.itemID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [itemID]);
        return result.rows[0] || null;
    }
    static async updatePrice(itemID, basePrice) {
        const result = await dbConnection_1.default.query('UPDATE MenuItem SET basePrice = $1 WHERE itemID = $2 RETURNING itemID, basePrice AS "basePrice"', [basePrice, itemID]);
        return result.rows[0];
    }
    static async toggleAvailability(itemID) {
        const result = await dbConnection_1.default.query(`UPDATE MenuItem
             SET isAvailable = NOT isAvailable
             WHERE itemID = $1
             RETURNING itemID, isAvailable AS "isAvailable"`, [itemID]);
        return result.rows[0];
    }
    static async delete(itemID) {
        const result = await dbConnection_1.default.query("DELETE FROM MenuItem WHERE itemID = $1 RETURNING itemID", [itemID]);
        return result.rows[0];
    }
}
exports.MenuItem = MenuItem;
