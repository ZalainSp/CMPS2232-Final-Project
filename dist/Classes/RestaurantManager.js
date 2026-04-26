"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantManager = exports.RestaurantManagerDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const Users_1 = require("./Users");
class RestaurantManagerDef extends Users_1.Users {
}
exports.RestaurantManagerDef = RestaurantManagerDef;
class RestaurantManager extends RestaurantManagerDef {
    constructor(userID, username, email, contactNumber, restaurantID, restaurantName, openingHours) {
        super(userID, username, email, contactNumber);
        this.restaurantID = restaurantID;
        this.restaurantName = restaurantName;
        this.openingHours = openingHours;
    }
    getRole() {
        return "RestaurantManager";
    }
    getRestaurantID() {
        return this.restaurantID;
    }
    getRestaurantName() {
        return this.restaurantName;
    }
    getOpeningHours() {
        return this.openingHours;
    }
    setRestaurantName(name) {
        this.restaurantName = name;
    }
    setOpeningHours(hours) {
        this.openingHours = hours;
    }
    static async getAll() {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber,
                   rm.restaurantID, rm.restaurantName, rm.openingHours
            FROM Users u
            JOIN RestaurantManager rm ON u.userID = rm.userID
            ORDER BY rm.restaurantName ASC;
        `;
        const result = await dbConnection_1.default.query(query);
        return result.rows;
    }
    static async getById(userID) {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber,
                   rm.restaurantID, rm.restaurantName, rm.openingHours
            FROM Users u
            JOIN RestaurantManager rm ON u.userID = rm.userID
            WHERE u.userID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return result.rows[0];
    }
    static async add(username, email, contactNumber, restaurantID, restaurantName, openingHours) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            const usersRes = await client.query("INSERT INTO Users (username, email, contactNumber) VALUES ($1, $2, $3) RETURNING userID", [username, email, contactNumber]);
            const userID = usersRes.rows[0].userid;
            await client.query("INSERT INTO RestaurantManager (userID, restaurantID, restaurantName, openingHours) VALUES ($1, $2, $3, $4)", [userID, restaurantID, restaurantName, openingHours]);
            await client.query("COMMIT");
            return {
                userID,
                username,
                email,
                contactNumber,
                restaurantID,
                restaurantName,
                openingHours,
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
    static async updateRestaurantInfo(userID, restaurantName, openingHours) {
        const result = await dbConnection_1.default.query("UPDATE RestaurantManager SET restaurantName = $1, openingHours = $2 WHERE userID = $3 RETURNING userID", [restaurantName, openingHours, userID]);
        return result.rows[0];
    }
    static async getMenu(userID) {
        const query = `
            SELECT mi.itemID, mi.itemName, mi.basePrice, mi.isAvailable
            FROM MenuItem mi
            JOIN RestaurantManager rm ON rm.userID = $1
            ORDER BY mi.itemName ASC;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return result.rows;
    }
    static async getOrdersQueue(userID) {
        const query = `
            SELECT o.orderID, o.orderDate, o.deliveryType, o.status, o.userID
            FROM \`Orders\` o
            WHERE o.status NOT IN ('Delivered', 'Cancelled')
            ORDER BY o.orderDate ASC;
        `;
        const result = await dbConnection_1.default.query(query, []);
        return result.rows;
    }
    static async updateOrderstatus(orderID, newStatus) {
        const result = await dbConnection_1.default.query("UPDATE `Orders` SET status = $1 WHERE orderID = $2 RETURNING orderID, status", [newStatus, orderID]);
        return result.rows[0];
    }
}
exports.RestaurantManager = RestaurantManager;
