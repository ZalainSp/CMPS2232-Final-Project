"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = exports.CartDef = void 0;
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
    async addItem(itemID) {
        return Cart.addItem(this.userID, itemID);
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
    // STATIC METHODS (FIXED RETURNS)
    static async getItems(userID) {
        return [];
    }
    static async addItem(userID, itemID) {
        return true;
    }
    static async removeItem(userID, itemID) {
        return true;
    }
    static async clear(userID) {
        return true;
    }
    static async calculateSubtotal(userID) {
        return 0;
    }
    static async isEmpty(userID) {
        return true;
    }
}
exports.Cart = Cart;
