import db from "../DB/dbConnection";
import { Users } from "./Users";

export abstract class DriverDef extends Users {
    protected driverID!: number;
    protected vehicleType!: string;
    protected available!: boolean;

    abstract getDriverID(): number;
    abstract getVehicleType(): string;
    abstract isAvailable(): boolean;
    abstract setAvailability(available: boolean): void;
    abstract setVehicleType(vehicleType: string): void;
}

export class Driver extends DriverDef {
    constructor(
        userID: number,
        username: string,
        email: string,
        contactNumber: string,
        driverID: number,
        vehicleType: string,
        available: boolean = true
    ) {
        super(userID, username, email, contactNumber);
        this.driverID = driverID;
        this.vehicleType = vehicleType;
        this.available = available;
    }

    getRole(): string {
        return "Driver";
    }

    getDriverID(): number {
        return this.driverID;
    }

    getVehicleType(): string {
        return this.vehicleType;
    }

    isAvailable(): boolean {
        return this.available;
    }

    setAvailability(available: boolean): void {
        this.available = available;
    }

    setVehicleType(vehicleType: string): void {
        this.vehicleType = vehicleType;
    }

    static async getAll() {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, d.driverID, d.vehicleType, d.available
            FROM Users u
            JOIN Driver d ON u.userID = d.userID
            ORDER BY u.userID ASC;
        `;
        const result = await db.query(query);
        return result.rows;
    }

    static async getById(userID: number) {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, d.driverID, d.vehicleType, d.available
            FROM Users u
            JOIN Driver d ON u.userID = d.userID
            WHERE u.userID = $1;
        `;
        const result = await db.query(query, [userID]);
        return result.rows[0];
    }

    static async getAvailable() {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber, d.driverID, d.vehicleType, d.available
            FROM Users u
            JOIN Driver d ON u.userID = d.userID
            WHERE d.available = TRUE;
        `;
        const result = await db.query(query);
        return result.rows;
    }

    static async add(username: string, email: string, contactNumber: string, driverID: number, vehicleType: string) {
        const client = await db.connect();
        try {
            await client.query("BEGIN");

            const usersRes = await client.query(
                "INSERT INTO Users (username, email, contactNumber) VALUES ($1, $2, $3) RETURNING userID",
                [username, email, contactNumber]
            );
            const userID = usersRes.rows[0].userid;

            await client.query(
                "INSERT INTO Driver (userID, driverID, vehicleType, available) VALUES ($1, $2, $3, TRUE)",
                [userID, driverID, vehicleType]
            );

            await client.query("COMMIT");
            return { userID, username, email, contactNumber, driverID, vehicleType, available: true };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    static async setAvailability(userID: number, available: boolean) {
        const result = await db.query(
            "UPDATE Driver SET available = $1 WHERE userID = $2 RETURNING userID, available",
            [available, userID]
        );
        return result.rows[0];
    }

    static async acceptDelivery(userID: number, orderID: number) {
        const client = await db.connect();
        try {
            await client.query("BEGIN");

            await client.query(
                "UPDATE `Orders` SET driverID = $1, status = 'Out for Delivery' WHERE orderID = $2",
                [userID, orderID]
            );
            await client.query(
                "UPDATE Driver SET available = FALSE WHERE userID = $1",
                [userID]
            );

            await client.query("COMMIT");
            return { success: true, message: "Delivery accepted" };
        } catch (error: any) {
            await client.query("ROLLBACK");
            return { success: false, message: error.message };
        } finally {
            client.release();
        }
    }

    static async updateDeliveryStatus(orderID: number, status: string) {
        const result = await db.query(
            "UPDATE `Orders` SET status = $1 WHERE orderID = $2 RETURNING orderID, status",
            [status, orderID]
        );
        return result.rows[0];
    }
}