import db from "../DB/dbConnection";
import { Users } from "./Users";

export abstract class AdminDef extends Users {
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

    getRole(): string {
        return "Admin";
    }

    getRoleTitle(): string {
        return this.roleTitle;
    }

    setRoleTitle(roleTitle: string): void {
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

        const result = await db.query(query);
        return result.rows;
    }

    static async getById(userID: number) {
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
        const result = await db.query(query, [userID]);
        return result.rows[0];
    }
}