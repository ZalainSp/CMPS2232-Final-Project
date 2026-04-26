"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = exports.CustomerDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const Users_1 = require("./Users");
class CustomerDef extends Users_1.Users {
}
exports.CustomerDef = CustomerDef;
class Customer extends CustomerDef {
    constructor(userID, username, email, contactNumber, deliveryAddress, userStatus) {
        super(userID, username, email, contactNumber);
        this.deliveryAddress = deliveryAddress;
        this.userStatus = userStatus;
    }
    getRole() {
        return "Customer";
    }
    getDeliveryAddress() {
        return this.deliveryAddress;
    }
    getUserStatus() {
        return this.userStatus;
    }
    setDeliveryAddress(address) {
        this.deliveryAddress = address;
    }
    setUserStatus(status) {
        this.userStatus = status;
    }
    static async getAll() {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, c.deliveryAddress, c.userStatus
            FROM Users u
            JOIN Customer c ON u.userID = c.userID
            ORDER BY u.userID ASC;
        `;
        const result = await dbConnection_1.default.query(query);
        return result.rows;
    }
    static async getById(userID) {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, c.deliveryAddress, c.userStatus
            FROM Users u
            JOIN Customer c ON u.userID = c.userID
            WHERE u.userID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return result.rows[0];
    }
    static async add(username, email, contactNumber, deliveryAddress, userStatus) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            const usersRes = await client.query("INSERT INTO Users (username, email, contactNumber) VALUES ($1, $2, $3) RETURNING userID", [username, email, contactNumber]);
            const userID = usersRes.rows[0].userid;
            await client.query("INSERT INTO Customer (userID, deliveryAddress, userStatus) VALUES ($1, $2, $3)", [userID, deliveryAddress, userStatus]);
            await client.query("INSERT INTO Cart (userID) VALUES ($1)", [userID]);
            await client.query("COMMIT");
            return {
                userID,
                username,
                email,
                contactNumber,
                deliveryAddress,
                userStatus,
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
    static async updateDeliveryAddress(userID, address) {
        const result = await dbConnection_1.default.query("UPDATE Customer SET deliveryAddress = $1 WHERE userID = $2 RETURNING userID", [address, userID]);
        return result.rows[0];
    }
    static async getOrdersHistory(userID) {
        const query = `
            SELECT o.orderID, o.orderDate, o.deliveryType, o.status
            FROM \`Orders\` o
            WHERE o.userID = $1
            ORDER BY o.orderDate DESC;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return result.rows;
    }
    static async trackOrderstatus(orderID) {
        const query = `SELECT orderID, status FROM \`Orders\` WHERE orderID = $1`;
        const result = await dbConnection_1.default.query(query, [orderID]);
        return result.rows[0];
    }
}
exports.Customer = Customer;
