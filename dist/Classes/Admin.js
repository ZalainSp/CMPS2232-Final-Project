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
    getRole() { return "Admin"; }
    getRoleTitle() { return this.roleTitle; }
    setRoleTitle(roleTitle) { this.roleTitle = roleTitle; }
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
    static async add(username, email, contactNumber, roleTitle) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            const usersRes = await client.query("INSERT INTO Users (username, email, contactNumber) VALUES ($1, $2, $3) RETURNING userID", [username, email, contactNumber]);
            const userID = usersRes.rows[0].userid;
            await client.query("INSERT INTO Admin (userID, roleTitle) VALUES ($1, $2)", [userID, roleTitle]);
            await client.query("COMMIT");
            return { userID, username, email, contactNumber, roleTitle };
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async removeUsers(targetUserID) {
        const result = await dbConnection_1.default.query("DELETE FROM Users WHERE userID = $1 RETURNING userID", [targetUserID]);
        return result.rows[0];
    }
    static async generateOrdersReport(allOrders) {
        const total = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        return {
            totalOrders: total,
            totalRevenue: totalRevenue.toFixed(2),
            orders: allOrders,
        };
    }
}
exports.Admin = Admin;
