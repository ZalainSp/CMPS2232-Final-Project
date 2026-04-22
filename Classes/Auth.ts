import db from "../DB/dbConnection";
import crypto from "crypto";

export abstract class AuthDef {
}

export interface RegisterData {
    username: string;
    email: string;
    contactNumber: string;
    password: string;
    confirmPassword: string;
    role: "Customer" | "Manager" | "Driver" | "Admin";

    deliveryAddress?: string;
    restaurantID?: number;
    restaurantName?: string;
    openingHours?: string;
    driverID?: number;
    vehicleType?: string;
}

export interface AuthResult {
    success: boolean;
    message: string;
    token?: string;
    users?: {
        userID: number;
        username: string;
        email: string;
        role: string;
    };
}

export class Auth extends AuthDef {
    // =========================
    // FIXED LOGIN (MAIN CHANGE)
    // =========================
    static async login(username: string, password: string, role: string): Promise<AuthResult> {
        try {
            const usersRes = await db.query(
                "SELECT userID AS \"userID\", username AS \"username\", email AS \"email\", passwordHash AS \"passwordHash\", passwordSalt AS \"passwordSalt\" FROM Users WHERE username = $1",
                [username]
            );

            if (usersRes.rowCount === 0) {
                return { success: false, message: "Invalid username or password" };
            }

            const user = usersRes.rows[0];

            const hashed = Auth.hashPassword(password, user.passwordSalt);

            if (hashed !== user.passwordHash) {
                return { success: false, message: "Invalid username or password" };
            }

            // Check if the user is associated with the selected role
            const roleTable = Auth.getRoleTable(role);
            if (!roleTable) {
                return { success: false, message: "Invalid role selected" };
            }

            const roleRes = await db.query(`SELECT * FROM ${roleTable} WHERE userID = $1`, [user.userID]);

            if (roleRes.rowCount === 0) {
                return { success: false, message: `No ${role} account found for this user` };
            }

            const token = await Auth.createSession(user.userID, role);
            return {
                success: true,
                message: "Login successful",
                token,
                users: {
                    userID: user.userID,
                    username: user.username,
                    email: user.email,
                    role
                }
            };

        } catch (err: any) {
            return { success: false, message: err.message };
        }
    }

    // =========================
    // REGISTER (UNCHANGED CORE)
    // =========================
    static async register(data: RegisterData): Promise<AuthResult> {
        const { username, email, contactNumber, password, confirmPassword, role } = data;

        if (password !== confirmPassword) {
            return { success: false, message: "Passwords do not match" };
        }

        const salt = Auth.generateSalt();
        const hash = Auth.hashPassword(password, salt);

        const client = await db.connect();

        try {
            await client.query("BEGIN");

            const existing = await client.query(
                "SELECT userID FROM Users WHERE username = $1 OR email = $2",
                [username, email]
            );

            if (existing.rowCount! > 0) {
                await client.query("ROLLBACK");
                return { success: false, message: "User already exists" };
            }

            const userRes = await client.query(
                "INSERT INTO Users (username, email, contactNumber, passwordHash, passwordSalt) VALUES ($1,$2,$3,$4,$5) RETURNING userID AS \"userID\"",
                [username, email, contactNumber, hash, salt]
            );

            const userID = userRes.rows[0].userID;

            await Auth.insertRoleRecord(client, userID, role, data);

            await client.query("COMMIT");

            const token = await Auth.createSession(userID, role);

            return {
                success: true,
                message: "Registered",
                token,
                users: { userID, username, email, role }
            };

        } catch (e: any) {
            await client.query("ROLLBACK");
            return { success: false, message: e.message };
        } finally {
            client.release();
        }
    }

    static async logout(token: string): Promise<void> {
        await db.query("DELETE FROM Session WHERE token = $1", [token]);
    }

    static async createSession(userID: number | null, role: string): Promise<string> {
        const token = crypto.randomBytes(32).toString("hex");

        await db.query(
            "INSERT INTO Session (token, userID, role, expiresAt) VALUES ($1,$2,$3, NOW() + INTERVAL '8 hours')",
            [token, userID, role]
        );

        return token;
    }

    static async verifySession(token: string): Promise<{ userID: number; role: string } | null> {
        const res = await db.query(
            "SELECT userID AS \"userID\", role AS \"role\" FROM Session WHERE token = $1 AND expiresAt > NOW()",
            [token]
        );

        if (res.rowCount === 0) return null;

        return {
            userID: res.rows[0].userID,
            role: res.rows[0].role
        };
    }

    private static generateSalt() {
        return crypto.randomBytes(16).toString("hex");
    }

    private static hashPassword(password: string, salt: string) {
        return crypto.createHmac("sha256", salt).update(password).digest("hex");
    }

    private static getRoleTable(role: string): string | null {
        const map: any = {
            Customer: "Customer",
            Manager: "RestaurantManager",
            Driver: "Driver",
            Admin: "Admin"
        };
        return map[role] || null;
    }

    private static async insertRoleRecord(client: any, userID: number, role: string, data: RegisterData) {
        switch (role) {
            case "Customer":
                await client.query(
                    "INSERT INTO Customer (userID, deliveryAddress, userStatus) VALUES ($1,$2,'Active')",
                    [userID, data.deliveryAddress]
                );
                break;

            case "Manager":
                await client.query(
                    "INSERT INTO RestaurantManager (userID, restaurantID, restaurantName, openingHours) VALUES ($1,$2,$3,$4)",
                    [userID, data.restaurantID ?? null, data.restaurantName, data.openingHours]
                );
                break;

            case "Driver":
                await client.query(
                    "INSERT INTO Driver (userID, driverID, vehicleType, available) VALUES ($1,$2,$3,true)",
                    [userID, data.driverID ?? null, data.vehicleType]
                );
                break;

            case "Admin":
                await client.query(
                    "INSERT INTO Admin (userID, roleTitle) VALUES ($1,'System Admin')",
                    [userID]
                );
                break;
        }
    }
}