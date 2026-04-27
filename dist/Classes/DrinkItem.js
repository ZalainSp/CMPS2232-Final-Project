"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrinkItem = exports.DrinkItemDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
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
    static async getAll() {
        const query = `
            SELECT
                mi.itemID AS "itemID",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                mi.isAvailable AS "isAvailable",
                di.cupSize AS "cupSize"
            FROM MenuItem mi
            JOIN DrinkItem di ON mi.itemID = di.itemID
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
                di.cupSize AS "cupSize"
            FROM MenuItem mi
            JOIN DrinkItem di ON mi.itemID = di.itemID
            WHERE mi.itemID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [itemID]);
        return result.rows[0] || null;
    }
    static async add(itemName, basePrice, available, cupSize) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            const miRes = await client.query(`INSERT INTO MenuItem (itemName, basePrice, isAvailable)
                 VALUES ($1, $2, $3)
                 RETURNING itemID AS "itemID"`, [itemName, basePrice, available]);
            const itemID = miRes.rows[0].itemID;
            await client.query("INSERT INTO DrinkItem (itemID, cupSize) VALUES ($1, $2)", [itemID, cupSize]);
            await client.query("COMMIT");
            return {
                itemID,
                itemName,
                basePrice,
                isAvailable: available,
                cupSize,
                type: "drink",
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
    static async updateCupSize(itemID, cupSize) {
        const result = await dbConnection_1.default.query(`UPDATE DrinkItem SET cupSize = $1 WHERE itemID = $2
             RETURNING itemID, cupSize AS "cupSize"`, [cupSize, itemID]);
        return result.rows[0];
    }
}
exports.DrinkItem = DrinkItem;
