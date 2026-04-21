import db from "../DB/dbConnection";
export abstract class UserDef {
    protected userID!: number;
    protected username!: string;
    protected email!: string;
    protected contactNumber!: string;

    abstract getRole(): string;

    abstract getUserID(): number;
    abstract getUsername(): string;
    abstract getEmail(): string;
    abstract getContactNumber(): string;

    abstract setEmail(email: string): void;
    abstract setContactNumber(contactNumber: string): void;
}

export class User extends UserDef {
    constructor(
        userID: number,
        username: string,
        email: string,
        contactNumber: string
    ) {
        super();
        this.userID = userID;
        this.username = username;
        this.email = email;
        this.contactNumber = contactNumber;
    }

    getRole(): string { return "User"; }
    getUserID(): number { return this.userID; }
    getUsername(): string { return this.username; }
    getEmail(): string { return this.email; }
    getContactNumber(): string { return this.contactNumber; }

    setEmail(email: string): void { this.email = email; }
    setContactNumber(contactNumber: string): void { this.contactNumber = contactNumber; }

    getDetails(): string {
        return `[${this.getRole()}] ID: ${this.userID} | Name: ${this.username} | Email: ${this.email} | Contact: ${this.contactNumber}`;
    }
 
    static async getAll() {
        const result = await db.query("SELECT * FROM User ORDER BY userID ASC");
        return result.rows;
    }
 
    static async getById(userID: number) {
        const result = await db.query("SELECT * FROM User WHERE userID = $1", [userID]);
        return result.rows[0];
    }
 
    static async delete(userID: number) {
        const result = await db.query("DELETE FROM User WHERE userID = $1 RETURNING userID", [userID]);
        return result.rows[0];
    }
}