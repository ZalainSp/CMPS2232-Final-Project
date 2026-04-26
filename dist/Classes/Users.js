"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = exports.UsersDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
class UsersDef {
}
exports.UsersDef = UsersDef;
class Users extends UsersDef {
    constructor(userID, username, email, contactNumber) {
        super();
        this.userID = userID;
        this.username = username;
        this.email = email;
        this.contactNumber = contactNumber;
    }
    getRole() {
        return "Users";
    }
    getUserID() {
        return this.userID;
    }
    getUsername() {
        return this.username;
    }
    getEmail() {
        return this.email;
    }
    getContactNumber() {
        return this.contactNumber;
    }
    setEmail(email) {
        this.email = email;
    }
    setContactNumber(contactNumber) {
        this.contactNumber = contactNumber;
    }
    getDetails() {
        return `[${this.getRole()}] ID: ${this.userID} | Name: ${this.username} | Email: ${this.email} | Contact: ${this.contactNumber}`;
    }
    static async getAll() {
        const result = await dbConnection_1.default.query("SELECT * FROM Users ORDER BY userID ASC");
        return result.rows;
    }
    static async getById(userID) {
        const result = await dbConnection_1.default.query("SELECT * FROM Users WHERE userID = $1", [
            userID,
        ]);
        return result.rows[0];
    }
    static async delete(userID) {
        const result = await dbConnection_1.default.query("DELETE FROM Users WHERE userID = $1 RETURNING userID", [userID]);
        return result.rows[0];
    }
}
exports.Users = Users;
