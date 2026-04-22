"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoCode = exports.PromoCodeDef = void 0;
class PromoCodeDef {
}
exports.PromoCodeDef = PromoCodeDef;
class PromoCode extends PromoCodeDef {
    constructor(code, discountPercent, active) {
        super();
        this.code = code;
        this.discountPercent = discountPercent;
        this.active = active;
    }
    getCode() {
        return this.code;
    }
    getDiscountPercent() {
        return this.discountPercent;
    }
    isActive() {
        return this.active;
    }
    deactivate() {
        this.active = false;
    }
    static async getAll() {
        return [];
    }
    static async getByCode(code) {
        return null;
    }
    static async add(code, discountPercent, active = true) {
        return true;
    }
    static async deactivate(code) {
        return true;
    }
    static async validate(code, subtotal) {
        const result = {
            valid: false,
            discount: 0,
            message: "Not implemented yet"
        };
        return result;
    }
}
exports.PromoCode = PromoCode;
