"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = exports.CartDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
class CartDef {
}
exports.CartDef = CartDef;
class Cart extends CartDef {
    constructor(userID) {
        super();
        this.userID = userID;
    }
    getUserID() {
        return this.userID;
    }
    async addItem(itemID, quantity = 1) {
        return Cart.addItem(this.userID, itemID, quantity);
    }
    async removeItem(itemID) {
        return Cart.removeItem(this.userID, itemID);
    }
    async clear() {
        return Cart.clear(this.userID);
    }
    async getItems() {
        return Cart.getItems(this.userID);
    }
    async calculateSubtotal() {
        return Cart.calculateSubtotal(this.userID);
    }
    async isEmpty() {
        return Cart.isEmpty(this.userID);
    }
    static async getItems(userID) {
        const query = `
            SELECT
                ci.itemID AS "itemID",
                ci.quantity AS "quantity",
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
                cm.discountAmount AS "discountAmount",
                CASE
                    WHEN cm.itemID IS NOT NULL
                        THEN GREATEST(0, mi.basePrice - cm.discountAmount) * ci.quantity
                    ELSE mi.basePrice * ci.quantity
                END AS "lineTotal"
            FROM CartItem ci
            JOIN MenuItem mi ON ci.itemID = mi.itemID
            LEFT JOIN FoodItem fi ON mi.itemID = fi.itemID
            LEFT JOIN DrinkItem di ON mi.itemID = di.itemID
            LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
            WHERE ci.userID = $1
            ORDER BY mi.itemName ASC;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return result.rows;
    }
    static async addItem(userID, itemID, quantity = 1) {
        //increase quantity if already in cart
        const result = await dbConnection_1.default.query(`INSERT INTO CartItem (userID, itemID, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (userID, itemID)
             DO UPDATE SET quantity = CartItem.quantity + EXCLUDED.quantity
             RETURNING userID, itemID, quantity`, [userID, itemID, quantity]);
        return result.rows[0];
    }
    static async removeItem(userID, itemID) {
        const result = await dbConnection_1.default.query("DELETE FROM CartItem WHERE userID = $1 AND itemID = $2 RETURNING itemID", [userID, itemID]);
        return result.rows[0] || null;
    }
    static async updateQuantity(userID, itemID, quantity) {
        if (quantity <= 0)
            return Cart.removeItem(userID, itemID);
        const result = await dbConnection_1.default.query(`UPDATE CartItem SET quantity = $1 WHERE userID = $2 AND itemID = $3
             RETURNING userID, itemID, quantity`, [quantity, userID, itemID]);
        return result.rows[0] || null;
    }
    static async clear(userID) {
        await dbConnection_1.default.query("DELETE FROM CartItem WHERE userID = $1", [userID]);
        return { success: true };
    }
    static async calculateSubtotal(userID) {
        const query = `
            SELECT COALESCE(SUM(
                CASE
                    WHEN cm.itemID IS NOT NULL
                        THEN GREATEST(0, mi.basePrice - cm.discountAmount) * ci.quantity
                    ELSE mi.basePrice * ci.quantity
                END
            ), 0) AS subtotal
            FROM CartItem ci
            JOIN MenuItem mi ON ci.itemID = mi.itemID
            LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
            WHERE ci.userID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return parseFloat(result.rows[0].subtotal);
    }
    static async isEmpty(userID) {
        const result = await dbConnection_1.default.query("SELECT COUNT(*) AS cnt FROM CartItem WHERE userID = $1", [userID]);
        return parseInt(result.rows[0].cnt, 10) === 0;
    }
    static async getCount(userID) {
        const result = await dbConnection_1.default.query("SELECT COALESCE(SUM(quantity), 0) AS cnt FROM CartItem WHERE userID = $1", [userID]);
        return parseInt(result.rows[0].cnt, 10);
    }
}
exports.Cart = Cart;
