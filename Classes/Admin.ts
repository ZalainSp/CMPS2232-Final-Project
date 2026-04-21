import db from "../DB/dbConnection";
import { User } from "./User";

export abstract class AdminDef extends User {
    protected roleTitle!: string;

    abstract getRoleTitle(): string;
    abstract setRoleTitle(roleTitle: string): void;
}

export class Admin extends AdminDef {
    constructor(
        userID: number,
        username: string,
        email: string,
        contactNumber: string,
        roleTitle: string
    ) {
        super(userID, username, email, contactNumber);
        this.roleTitle = roleTitle;
    }

    getRole(): string { return "Admin"; }
    getRoleTitle(): string { return this.roleTitle; }
    setRoleTitle(roleTitle: string): void { this.roleTitle = roleTitle; }

    static async getAll() {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, a.roleTitle
            FROM User u
            JOIN Admin a ON u.userID = a.userID
            ORDER BY u.userID ASC;
        `;
        const result = await db.query(query);
        return result.rows;
    }
 
    static async getById(userID: number) {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, a.roleTitle
            FROM User u
            JOIN Admin a ON u.userID = a.userID
            WHERE u.userID = $1;
        `;
        const result = await db.query(query, [userID]);
        return result.rows[0];
    }
 
    static async add(username: string, email: string, contactNumber: string, roleTitle: string) {
        const client = await db.connect();
        try {
            await client.query("BEGIN");
 
            const userRes = await client.query(
                "INSERT INTO User (username, email, contactNumber) VALUES ($1, $2, $3) RETURNING userID",
                [username, email, contactNumber]
            );
            const userID = userRes.rows[0].userid;
 
            await client.query(
                "INSERT INTO Admin (userID, roleTitle) VALUES ($1, $2)",
                [userID, roleTitle]
            );
 
            await client.query("COMMIT");
            return { userID, username, email, contactNumber, roleTitle };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
 
    static async removeUser(targetUserID: number) {
        const result = await db.query("DELETE FROM User WHERE userID = $1 RETURNING userID", [targetUserID]);
        return result.rows[0];
    }
 
    static async generateOrderReport(allOrders: any[]) {
        const total = allOrders.length;
        const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        return {
            totalOrders: total,
            totalRevenue: totalRevenue.toFixed(2),
            orders: allOrders,
        };
    }
}