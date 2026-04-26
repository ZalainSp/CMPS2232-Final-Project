"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin = exports.AdminDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const Users_1 = require("./Users");
class AdminDef extends Users_1.Users {
}
exports.AdminDef = AdminDef;
class Admin extends AdminDef {
    constructor(userID, username, email, contactNumber, roleTitle) {
        super(userID, username, email, contactNumber);
        this.roleTitle = roleTitle;
    }
    getRole() {
        return "Admin";
    }
    getRoleTitle() {
        return this.roleTitle;
    }
    setRoleTitle(roleTitle) {
        this.roleTitle = roleTitle;
    }
    static async getAll() {
        const query = `
            SELECT 
                u.userID AS "userID",
                u.username AS "username",
                u.email AS "email",
                u.contactNumber AS "contactNumber",
                CASE 
                    WHEN a.userID IS NOT NULL THEN 'Admin'
                    WHEN c.userID IS NOT NULL THEN 'Customer'
                    WHEN d.userID IS NOT NULL THEN 'Driver'
                    WHEN rm.userID IS NOT NULL THEN 'Manager'
                    ELSE 'Unknown'
                END AS role
            FROM Users u
            LEFT JOIN Admin a ON u.userID = a.userID
            LEFT JOIN Customer c ON u.userID = c.userID
            LEFT JOIN Driver d ON u.userID = d.userID
            LEFT JOIN RestaurantManager rm ON u.userID = rm.userID
            ORDER BY u.userID ASC;
        `;
        const result = await dbConnection_1.default.query(query);
        return result.rows;
    }
    static async getById(userID) {
        const query = `
            SELECT 
                u.userID AS "userID",
                u.username AS "username",
                u.email AS "email",
                u.contactNumber AS "contactNumber",
                a.roleTitle AS "roleTitle"
            FROM Users u
            JOIN Admin a ON u.userID = a.userID
            WHERE u.userID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return result.rows[0];
    }
}
exports.Admin = Admin;
