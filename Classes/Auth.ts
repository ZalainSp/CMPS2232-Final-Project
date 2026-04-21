import db from "../DB/dbConnection";
import crypto from "crypto";

export abstract class AuthDef {
    abstract login(username: string, password: string, role: string): Promise<AuthResult>;
    abstract register(data: RegisterData): Promise<AuthResult>;
    abstract logout(token: string): Promise<void>;
}

export interface RegisterData {
    username: string;
    email: string;
    contactNumber: string;
    password: string;
    confirmPassword: string;
    role: "Customer" | "Manager" | "Driver";

    //customer only
    deliveryAddress?: string;

    //manager only
    restaurantID?: number;
    restaurantName?: string;
    openingHours?: string;

    //driver only
    driverID?: number;
    vehicleType?: string;
}

export interface AuthResult {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        userID: number;
        username: string;
        email: string;
        role: string;
    };
}

export class Auth extends AuthDef {

    async login(username: string, password: string, role: string): Promise<AuthResult> {
        return Auth.login(username, password, role);
    }

    async register(data: RegisterData): Promise<AuthResult> {
        return Auth.register(data);
    }

    async logout(token: string): Promise<void> {
        return Auth.logout(token);
    }

    //login

    static async login(username: string, password: string, role: string): Promise<AuthResult> {
        try {
            const userRes = await db.query(
                "SELECT * FROM User WHERE username = $1",
                [username]
            );

            if (userRes.rowCount === 0) {
                return { success: false, message: "Invalid username or password" };
            }

            const user = userRes.rows[0];

            const isMatch = Auth.hashPassword(password, user.passwordsalt) === user.passwordhash;
            if (!isMatch) {
                return { success: false, message: "Invalid username or password" };
            }

            //check if the user associates with the selected role
            const roleTable = Auth.getRoleTable(role);
            if (!roleTable) {
                return { success: false, message: "Invalid role selected" };
            }

            const roleRes = await db.query(
                `SELECT * FROM ${roleTable} WHERE userID = $1`,
                [user.userid]
            );

            if (roleRes.rowCount === 0) {
                return { success: false, message: `No ${role} account found for this user` };
            }

            const token = await Auth.createSession(user.userid, role);

            return {
                success: true,
                message: "Login successful",
                token,
                user: {
                    userID: user.userid,
                    username: user.username,
                    email: user.email,
                    role,
                },
            };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    //guest login

    static async guestLogin(): Promise<AuthResult> {
        const token = await Auth.createSession(null, "Guest");
        return {
            success: true,
            message: "Continuing as guest",
            token,
            user: {
                userID: 0,
                username: "Guest",
                email: "",
                role: "Guest",
            },
        };
    }

    //register

    static async register(data: RegisterData): Promise<AuthResult> {
        const { username, email, contactNumber, password, confirmPassword, role } = data;

        if (password !== confirmPassword) {
            return { success: false, message: "Passwords do not match" };
        }

        const passwordError = Auth.validatePassword(password);
        if (passwordError) {
            return { success: false, message: passwordError };
        }

        const fieldError = Auth.validateRoleFields(data);
        if (fieldError) {
            return { success: false, message: fieldError };
        }

        const client = await db.connect();
        try {
            await client.query("BEGIN");

            //check username and email if not already taken
            const existing = await client.query(
                "SELECT userID FROM User WHERE username = $1 OR email = $2",
                [username, email]
            );
            if (existing.rowCount! > 0) {
                await client.query("ROLLBACK");
                return { success: false, message: "Username or email already in use" };
            }

            const salt = Auth.generateSalt();
            const hash = Auth.hashPassword(password, salt);

            const userRes = await client.query(
                "INSERT INTO User (username, email, contactNumber, passwordHash, passwordSalt) VALUES ($1, $2, $3, $4, $5) RETURNING userID",
                [username, email, contactNumber, hash, salt]
            );
            const userID = userRes.rows[0].userid;

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
                user: { userID, username, email, role },
            };
        } catch (error: any) {
            await client.query("ROLLBACK");
            return { success: false, message: error.message };
        } finally {
            client.release();
        }
    }

    //logout
    static async logout(token: string): Promise<void> {
        await db.query("DELETE FROM Session WHERE token = $1", [token]);
    }

    //session
    static async createSession(userID: number | null, role: string): Promise<string> {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

        await db.query(
            "INSERT INTO Session (token, userID, role, expiresAt) VALUES ($1, $2, $3, $4)",
            [token, userID, role, expiresAt]
        );

        return token;
    }

    static async verifySession(token: string): Promise<{ userID: number; role: string } | null> {
        const result = await db.query(
            "SELECT * FROM Session WHERE token = $1 AND expiresAt > NOW()",
            [token]
        );

        if (result.rowCount === 0) return null;

        return {
            userID: result.rows[0].userid,
            role: result.rows[0].role,
        };
    }

    //password hashing
    private static generateSalt(): string {
        return crypto.randomBytes(16).toString("hex");
    }

    private static hashPassword(password: string, salt: string): string {
        return crypto
            .createHmac("sha256", salt)
            .update(password)
            .digest("hex");
    }

//validation and helper functions
    private static getRoleTable(role: string): string | null {
        const map: Record<string, string> = {
            Customer: "Customer",
            Manager: "RestaurantManager",
            Driver: "Driver",
            Admin: "Admin",
        };
        return map[role] || null;
    }

    private static validatePassword(password: string): string | null {
        if (password.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
        if (!/[0-9]/.test(password)) return "Password must contain at least one number";
        return null;
    }

    private static validateRoleFields(data: RegisterData): string | null {
        if (data.role === "Customer" && !data.deliveryAddress) {
            return "Delivery address is required for customers";
        }
        if (data.role === "Manager") {
            if (!data.restaurantName) return "Restaurant name is required for managers";
            if (!data.openingHours) return "Opening hours are required for managers";
        }
        if (data.role === "Driver" && !data.vehicleType) {
            return "Vehicle type is required for drivers";
        }
        return null;
    }

    private static async insertRoleRecord(client: any, userID: number, role: string, data: RegisterData) {
        switch (role) {
            case "Customer":
                await client.query(
                    "INSERT INTO Customer (userID, deliveryAddress, userStatus) VALUES ($1, $2, 'Active')",
                    [userID, data.deliveryAddress]
                );
                break;
            case "Manager":
                await client.query(
                    "INSERT INTO RestaurantManager (userID, restaurantID, restaurantName, openingHours) VALUES ($1, $2, $3, $4)",
                    [userID, data.restaurantID ?? null, data.restaurantName, data.openingHours]
                );
                break;
            case "Driver":
                await client.query(
                    "INSERT INTO Driver (userID, driverID, vehicleType, available) VALUES ($1, $2, $3, TRUE)",
                    [userID, data.driverID ?? null, data.vehicleType]
                );
                break;
            default:
                throw new Error("Invalid role for registration");
        }
    }
}