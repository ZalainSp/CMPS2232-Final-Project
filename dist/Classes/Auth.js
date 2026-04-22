"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = exports.AuthDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const crypto_1 = __importDefault(require("crypto"));
class AuthDef {
}
exports.AuthDef = AuthDef;
class Auth extends AuthDef {
    //login
    static async login(username, password, role) {
        try {
            const usersRes = await dbConnection_1.default.query("SELECT userID AS \"userID\", username AS \"username\", email AS \"email\", passwordHash AS \"passwordHash\", passwordSalt AS \"passwordSalt\" FROM Users WHERE username = $1", [username]);
            if (usersRes.rowCount === 0) {
                return { success: false, message: "Invalid username or password" };
            }
            const users = usersRes.rows[0];
            const isMatch = Auth.hashPassword(password, users.passwordSalt) === users.passwordHash;
            if (!isMatch) {
                return { success: false, message: "Invalid username or password" };
            }
            //check if the users associates with the selected role
            const roleTable = Auth.getRoleTable(role);
            if (!roleTable) {
                return { success: false, message: "Invalid role selected" };
            }
            const roleRes = await dbConnection_1.default.query(`SELECT * FROM ${roleTable} WHERE userID = $1`, [users.userID]);
            if (roleRes.rowCount === 0) {
                return { success: false, message: `No ${role} account found for this users` };
            }
            const token = await Auth.createSession(users.userID, role);
            return {
                success: true,
                message: "Login successful",
                token,
                users: {
                    userID: users.userid,
                    username: users.username,
                    email: users.email,
                    role,
                },
            };
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
    //guest login
    static async guestLogin() {
        const token = await Auth.createSession(null, "Guest");
        return {
            success: true,
            message: "Continuing as guest",
            token,
            users: {
                userID: 0,
                username: "Guest",
                email: "",
                role: "Guest",
            },
        };
    }
    //register
    static async register(data) {
        const { username, email, contactNumber, password, confirmPassword, role } = data;
        if (password !== confirmPassword) {
            return { success: false, message: "Passwords do not match" };
        }
        const passwordersror = Auth.validatePassword(password);
        if (passwordersror) {
            return { success: false, message: passwordersror };
        }
        const fieldError = Auth.validateRoleFields(data);
        if (fieldError) {
            return { success: false, message: fieldError };
        }
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            //check username and email if not already taken
            const existing = await client.query("SELECT userID FROM Users WHERE username = $1 OR email = $2", [username, email]);
            if (existing.rowCount > 0) {
                await client.query("ROLLBACK");
                return { success: false, message: "Username or email already in use" };
            }
            const salt = Auth.generateSalt();
            const hash = Auth.hashPassword(password, salt);
            const usersRes = await client.query("INSERT INTO Users (username, email, contactNumber, passwordHash, passwordSalt) VALUES ($1, $2, $3, $4, $5) RETURNING userID AS \"userID\"", [username, email, contactNumber, hash, salt]);
            const userID = usersRes.rows[0].userID;
            await Auth.insertRoleRecord(client, userID, role, data);
            //autocreate cart for customers
            if (role === "Customer") {
                await client.query("INSERT INTO Cart (userID) VALUES ($1)", [userID]);
            }
            await client.query("COMMIT");
            const token = await Auth.createSession(userID, role);
            return {
                success: true,
                message: "Account created successfully",
                token,
                users: { userID, username, email, role },
            };
        }
        catch (error) {
            await client.query("ROLLBACK");
            return { success: false, message: error.message };
        }
        finally {
            client.release();
        }
    }
    //logout
    static async logout(token) {
        await dbConnection_1.default.query("DELETE FROM Session WHERE token = $1", [token]);
    }
    //session
    static async createSession(userID, role) {
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
        await dbConnection_1.default.query("INSERT INTO Session (token, userID, role, expiresAt) VALUES ($1, $2, $3, $4)", [token, userID, role, expiresAt]);
        return token;
    }
    static async verifySession(token) {
        const result = await dbConnection_1.default.query("SELECT userID AS \"userID\", role AS \"role\" FROM Session WHERE token = $1 AND expiresAt > NOW()", [token]);
        if (result.rowCount === 0)
            return null;
        return {
            userID: result.rows[0].userID,
            role: result.rows[0].role,
        };
    }
    //password hashing
    static generateSalt() {
        return crypto_1.default.randomBytes(16).toString("hex");
    }
    static hashPassword(password, salt) {
        return crypto_1.default
            .createHmac("sha256", salt)
            .update(password)
            .digest("hex");
    }
    //validation and helper functions
    static getRoleTable(role) {
        const map = {
            Customer: "Customer",
            Manager: "RestaurantManager",
            Driver: "Driver",
            Admin: "Admin",
        };
        return map[role] || null;
    }
    static validatePassword(password) {
        if (password.length < 8)
            return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(password))
            return "Password must contain at least one uppercase letter";
        if (!/[0-9]/.test(password))
            return "Password must contain at least one number";
        return null;
    }
    static validateRoleFields(data) {
        if (data.role === "Customer" && !data.deliveryAddress) {
            return "Delivery address is required for customers";
        }
        if (data.role === "Manager") {
            if (!data.restaurantName)
                return "Restaurant name is required for managers";
            if (!data.openingHours)
                return "Opening hours are required for managers";
        }
        if (data.role === "Driver" && !data.vehicleType) {
            return "Vehicle type is required for drivers";
        }
        return null;
    }
    static async insertRoleRecord(client, userID, role, data) {
        switch (role) {
            case "Customer":
                await client.query("INSERT INTO Customer (userID, deliveryAddress, userStatus) VALUES ($1, $2, 'Active')", [userID, data.deliveryAddress]);
                break;
            case "Manager":
                await client.query("INSERT INTO RestaurantManager (userID, restaurantID, restaurantName, openingHours) VALUES ($1, $2, $3, $4)", [userID, data.restaurantID ?? null, data.restaurantName, data.openingHours]);
                break;
            case "Driver":
                await client.query("INSERT INTO Driver (userID, driverID, vehicleType, available) VALUES ($1, $2, $3, TRUE)", [userID, data.driverID ?? null, data.vehicleType]);
                break;
            default:
                throw new Error("Invalid role for registration");
        }
    }
}
exports.Auth = Auth;
