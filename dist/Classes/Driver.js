"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Driver = exports.DriverDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const Users_1 = require("./Users");
class DriverDef extends Users_1.Users {
}
exports.DriverDef = DriverDef;
class Driver extends DriverDef {
    constructor(userID, username, email, contactNumber, driverID, vehicleType, available = true) {
        super(userID, username, email, contactNumber);
        this.driverID = driverID;
        this.vehicleType = vehicleType;
        this.available = available;
    }
    getRole() {
        return "Driver";
    }
    getDriverID() {
        return this.driverID;
    }
    getVehicleType() {
        return this.vehicleType;
    }
    isAvailable() {
        return this.available;
    }
    setAvailability(available) {
        this.available = available;
    }
    setVehicleType(vehicleType) {
        this.vehicleType = vehicleType;
    }
    static async getAll() {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, d.driverID, d.vehicleType, d.available
            FROM Users u
            JOIN Driver d ON u.userID = d.userID
            ORDER BY u.userID ASC;
        `;
        const result = await dbConnection_1.default.query(query);
        return result.rows;
    }
    static async getById(userID) {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, d.driverID, d.vehicleType, d.available
            FROM Users u
            JOIN Driver d ON u.userID = d.userID
            WHERE u.userID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return result.rows[0];
    }
    static async getAvailable() {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, d.driverID, d.vehicleType, d.available
            FROM Users u
            JOIN Driver d ON u.userID = d.userID
            WHERE d.available = TRUE;
        `;
        const result = await dbConnection_1.default.query(query);
        return result.rows;
    }
    static async add(username, email, contactNumber, driverID, vehicleType) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            const usersRes = await client.query("INSERT INTO Users (username, email, contactNumber) VALUES ($1, $2, $3) RETURNING userID", [username, email, contactNumber]);
            const userID = usersRes.rows[0].userid;
            await client.query("INSERT INTO Driver (userID, driverID, vehicleType, available) VALUES ($1, $2, $3, TRUE)", [userID, driverID, vehicleType]);
            await client.query("COMMIT");
            return {
                userID,
                username,
                email,
                contactNumber,
                driverID,
                vehicleType,
                available: true,
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
    static async setAvailability(userID, available) {
        const result = await dbConnection_1.default.query("UPDATE Driver SET available = $1 WHERE userID = $2 RETURNING userID, available", [available, userID]);
        return result.rows[0];
    }
    static async acceptDelivery(userID, orderID) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            await client.query("UPDATE `Orders` SET driverID = $1, status = 'Out for Delivery' WHERE orderID = $2", [userID, orderID]);
            await client.query("UPDATE Driver SET available = FALSE WHERE userID = $1", [userID]);
            await client.query("COMMIT");
            return { success: true, message: "Delivery accepted" };
        }
        catch (error) {
            await client.query("ROLLBACK");
            return { success: false, message: error.message };
        }
        finally {
            client.release();
        }
    }
    static async updateDeliveryStatus(orderID, status) {
        const result = await dbConnection_1.default.query("UPDATE `Orders` SET status = $1 WHERE orderID = $2 RETURNING orderID, status", [status, orderID]);
        return result.rows[0];
    }
}
exports.Driver = Driver;
