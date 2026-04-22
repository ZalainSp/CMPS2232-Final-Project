import db from "../DB/dbConnection";
import { Users } from "./Users";

export abstract class CustomerDef extends Users {
    protected deliveryAddress!: string;
    protected userStatus!: string;

    abstract getDeliveryAddress(): string;
    abstract getUserStatus(): string;
    abstract setDeliveryAddress(address: string): void;
    abstract setUserStatus(status: string): void;
}

export class Customer extends CustomerDef {
    constructor(
        userID: number,
        username: string,
        email: string,
        contactNumber: string,
        deliveryAddress: string,
        userStatus: string
    ) {
        super(userID, username, email, contactNumber);
        this.deliveryAddress = deliveryAddress;
        this.userStatus = userStatus;
    }

    getRole(): string {
        return "Customer";
    }

    getDeliveryAddress(): string {
        return this.deliveryAddress;
    }

    getUserStatus(): string {
        return this.userStatus;
    }

    setDeliveryAddress(address: string): void {
        this.deliveryAddress = address;
    }

    setUserStatus(status: string): void {
        this.userStatus = status;
    }

    static async getAll() {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, c.deliveryAddress, c.userStatus
            FROM Users u
            JOIN Customer c ON u.userID = c.userID
            ORDER BY u.userID ASC;
        `;
        const result = await db.query(query);
        return result.rows;
    }

    static async getById(userID: number) {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, c.deliveryAddress, c.userStatus
            FROM Users u
            JOIN Customer c ON u.userID = c.userID
            WHERE u.userID = $1;
        `;
        const result = await db.query(query, [userID]);
        return result.rows[0];
    }

    static async add(username: string, email: string, contactNumber: string, deliveryAddress: string, userStatus: string) {
        const client = await db.connect();
        try {
            await client.query("BEGIN");

            const usersRes = await client.query(
                "INSERT INTO Users (username, email, contactNumber) VALUES ($1, $2, $3) RETURNING userID",
                [username, email, contactNumber]
            );
            const userID = usersRes.rows[0].userid;

            await client.query(
                "INSERT INTO Customer (userID, deliveryAddress, userStatus) VALUES ($1, $2, $3)",
                [userID, deliveryAddress, userStatus]
            );
            await client.query(
                "INSERT INTO Cart (userID) VALUES ($1)",
                [userID]
            );

            await client.query("COMMIT");
            return { userID, username, email, contactNumber, deliveryAddress, userStatus };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    static async updateDeliveryAddress(userID: number, address: string) {
        const result = await db.query(
            "UPDATE Customer SET deliveryAddress = $1 WHERE userID = $2 RETURNING userID",
            [address, userID]
        );
        return result.rows[0];
    }

    static async getOrdersHistory(userID: number) {
        const query = `
            SELECT o.orderID, o.orderDate, o.deliveryType, o.status
            FROM \`Orders\` o
            WHERE o.userID = $1
            ORDER BY o.orderDate DESC;
        `;
        const result = await db.query(query, [userID]);
        return result.rows;
    }

    static async trackOrderstatus(orderID: number) {
        const query = `SELECT orderID, status FROM \`Orders\` WHERE orderID = $1`;
        const result = await db.query(query, [orderID]);
        return result.rows[0];
    }
}