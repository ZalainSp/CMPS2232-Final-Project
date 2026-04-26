"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoCode = exports.PromoCodeDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
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
        const result = await dbConnection_1.default.query(`SELECT code, discountPercent AS "discountPercent", active
             FROM PromoCode
             ORDER BY code ASC`);
        return result.rows;
    }
    static async getByCode(code) {
        const result = await dbConnection_1.default.query(`SELECT code, discountPercent AS "discountPercent", active
             FROM PromoCode
             WHERE code = $1`, [code.toUpperCase()]);
        return result.rows[0] || null;
    }
    static async add(code, discountPercent, active = true) {
        const result = await dbConnection_1.default.query(`INSERT INTO PromoCode (code, discountPercent, active)
             VALUES ($1, $2, $3)
             RETURNING code, discountPercent AS "discountPercent", active`, [code.toUpperCase(), discountPercent, active]);
        return result.rows[0];
    }
    static async deactivate(code) {
        const result = await dbConnection_1.default.query(`UPDATE PromoCode SET active = false WHERE code = $1
             RETURNING code, active`, [code.toUpperCase()]);
        return result.rows[0] || null;
    }
    static async validate(code, subtotal) {
        if (!code || code.trim() === "") {
            return {
                valid: false,
                discount: 0,
                discountPercent: 0,
                message: "No promo code provided",
            };
        }
        const promo = await PromoCode.getByCode(code.trim().toUpperCase());
        if (!promo) {
            return {
                valid: false,
                discount: 0,
                discountPercent: 0,
                message: "Invalid promo code",
            };
        }
        if (!promo.active) {
            return {
                valid: false,
                discount: 0,
                discountPercent: 0,
                message: "Promo code is no longer active",
            };
        }
        const discountPercent = parseFloat(promo.discountPercent);
        const discount = parseFloat((subtotal * (discountPercent / 100)).toFixed(2));
        return {
            valid: true,
            discount,
            discountPercent,
            message: `${discountPercent}% discount applied`,
        };
    }
}
exports.PromoCode = PromoCode;
