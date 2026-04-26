"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodItem = exports.FoodItemDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const MenuItem_1 = require("./MenuItem");
class FoodItemDef extends MenuItem_1.MenuItem {
}
exports.FoodItemDef = FoodItemDef;
class FoodItem extends FoodItemDef {
    constructor(itemID, itemName, basePrice, available, portionSize) {
        super(itemID, itemName, basePrice, available);
        this.portionSize = portionSize;
    }
    getPrice() {
        return this.basePrice;
    }
    getDescription() {
        return `${this.itemName} (${this.portionSize}) - $${this.basePrice.toFixed(2)}`;
    }
    getPortionSize() {
        return this.portionSize;
    }
    setPortionSize(size) {
        this.portionSize = size;
    }
    static async getAll() {
        const query = `
            SELECT
                mi.itemID AS "itemID",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                mi.isAvailable AS "isAvailable",
                fi.portionSize AS "portionSize"
            FROM MenuItem mi
            JOIN FoodItem fi ON mi.itemID = fi.itemID
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
                fi.portionSize AS "portionSize"
            FROM MenuItem mi
            JOIN FoodItem fi ON mi.itemID = fi.itemID
            WHERE mi.itemID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [itemID]);
        return result.rows[0] || null;
    }
    static async add(itemName, basePrice, available, portionSize) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            const miRes = await client.query(`INSERT INTO MenuItem (itemName, basePrice, isAvailable)
                 VALUES ($1, $2, $3)
                 RETURNING itemID AS "itemID"`, [itemName, basePrice, available]);
            const itemID = miRes.rows[0].itemID;
            await client.query("INSERT INTO FoodItem (itemID, portionSize) VALUES ($1, $2)", [itemID, portionSize]);
            await client.query("COMMIT");
            return {
                itemID,
                itemName,
                basePrice,
                isAvailable: available,
                portionSize,
                type: "food",
            };
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async updatePortionSize(itemID, portionSize) {
        const result = await dbConnection_1.default.query(`UPDATE FoodItem SET portionSize = $1 WHERE itemID = $2
             RETURNING itemID, portionSize AS "portionSize"`, [portionSize, itemID]);
        return result.rows[0];
    }
}
exports.FoodItem = FoodItem;
