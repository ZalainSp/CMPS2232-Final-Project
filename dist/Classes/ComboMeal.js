"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboMeal = exports.ComboMealDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const MenuItem_1 = require("./MenuItem");
class ComboMealDef extends MenuItem_1.MenuItem {
}
exports.ComboMealDef = ComboMealDef;
class ComboMeal extends ComboMealDef {
    constructor(itemID, itemName, basePrice, available, discountAmount) {
        super(itemID, itemName, basePrice, available);
        this.discountAmount = discountAmount;
    }
    getPrice() {
        return Math.max(0, this.basePrice - this.discountAmount);
    }
    getDescription() {
        return `${this.itemName} (Combo) - $${this.getPrice().toFixed(2)} (Save $${this.discountAmount.toFixed(2)})`;
    }
    getDiscountAmount() {
        return this.discountAmount;
    }
    setDiscountAmount(amount) {
        this.discountAmount = amount;
    }
    calculateSavings() {
        return this.discountAmount;
    }
    static async getAll() {
        const query = `
            SELECT
                mi.itemID AS "itemID",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                mi.isAvailable AS "isAvailable",
                cm.discountAmount AS "discountAmount",
                (mi.basePrice - cm.discountAmount) AS "finalPrice"
            FROM MenuItem mi
            JOIN ComboMeal cm ON mi.itemID = cm.itemID
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
                cm.discountAmount AS "discountAmount",
                (mi.basePrice - cm.discountAmount) AS "finalPrice"
            FROM MenuItem mi
            JOIN ComboMeal cm ON mi.itemID = cm.itemID
            WHERE mi.itemID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [itemID]);
        return result.rows[0] || null;
    }
    static async add(itemName, basePrice, available, discountAmount) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            const miRes = await client.query(`INSERT INTO MenuItem (itemName, basePrice, isAvailable)
                 VALUES ($1, $2, $3)
                 RETURNING itemID AS "itemID"`, [itemName, basePrice, available]);
            const itemID = miRes.rows[0].itemID;
            await client.query("INSERT INTO ComboMeal (itemID, discountAmount) VALUES ($1, $2)", [itemID, discountAmount]);
            await client.query("COMMIT");
            return {
                itemID,
                itemName,
                basePrice,
                isAvailable: available,
                discountAmount,
                finalPrice: basePrice - discountAmount,
                type: "combo",
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
    static async updateDiscount(itemID, discountAmount) {
        const result = await dbConnection_1.default.query(`UPDATE ComboMeal SET discountAmount = $1 WHERE itemID = $2
             RETURNING itemID, discountAmount AS "discountAmount"`, [discountAmount, itemID]);
        return result.rows[0];
    }
}
exports.ComboMeal = ComboMeal;
