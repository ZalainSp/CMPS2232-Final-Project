import db from "../DB/dbConnection";
import { User } from "./User";

export abstract class RestaurantManagerDef extends User {
    protected restaurantID!: number;
    protected restaurantName!: string;
    protected openingHours!: string;

    abstract getRestaurantID(): number;
    abstract getRestaurantName(): string;
    abstract getOpeningHours(): string;
    abstract setRestaurantName(name: string): void;
    abstract setOpeningHours(hours: string): void;
}

export class RestaurantManager extends RestaurantManagerDef {
    constructor(
        userID: number,
        username: string,
        email: string,
        contactNumber: string,
        restaurantID: number,
        restaurantName: string,
        openingHours: string
    ) {
        super(userID, username, email, contactNumber);
        this.restaurantID = restaurantID;
        this.restaurantName = restaurantName;
        this.openingHours = openingHours;
    }

    getRole(): string { return "RestaurantManager"; }
    getRestaurantID(): number { return this.restaurantID; }
    getRestaurantName(): string { return this.restaurantName; }
    getOpeningHours(): string { return this.openingHours; }
    setRestaurantName(name: string): void { this.restaurantName = name; }
    setOpeningHours(hours: string): void { this.openingHours = hours; }

    static async getAll() {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber,
                   rm.restaurantID, rm.restaurantName, rm.openingHours
            FROM User u
            JOIN RestaurantManager rm ON u.userID = rm.userID
            ORDER BY rm.restaurantName ASC;
        `;
        const result = await db.query(query);
        return result.rows;
    }
 
    static async getById(userID: number) {
        const query = `
            SELECT u.userID, u.username, u.email, u.contactNumber,
                   rm.restaurantID, rm.restaurantName, rm.openingHours
            FROM User u
            JOIN RestaurantManager rm ON u.userID = rm.userID
            WHERE u.userID = $1;
        `;
        const result = await db.query(query, [userID]);
        return result.rows[0];
    }
 
    static async add(username: string, email: string, contactNumber: string, restaurantID: number, restaurantName: string, openingHours: string) {
        const client = await db.connect();
        try {
            await client.query("BEGIN");
 
            const userRes = await client.query(
                "INSERT INTO User (username, email, contactNumber) VALUES ($1, $2, $3) RETURNING userID",
                [username, email, contactNumber]
            );
            const userID = userRes.rows[0].userid;
 
            await client.query(
                "INSERT INTO RestaurantManager (userID, restaurantID, restaurantName, openingHours) VALUES ($1, $2, $3, $4)",
                [userID, restaurantID, restaurantName, openingHours]
            );
 
            await client.query("COMMIT");
            return { userID, username, email, contactNumber, restaurantID, restaurantName, openingHours };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
 
    static async updateRestaurantInfo(userID: number, restaurantName: string, openingHours: string) {
        const result = await db.query(
            "UPDATE RestaurantManager SET restaurantName = $1, openingHours = $2 WHERE userID = $3 RETURNING userID",
            [restaurantName, openingHours, userID]
        );
        return result.rows[0];
    }
 
    static async getMenu(userID: number) {
        const query = `
            SELECT mi.itemID, mi.itemName, mi.basePrice, mi.isAvailable
            FROM MenuItem mi
            JOIN RestaurantManager rm ON rm.userID = $1
            ORDER BY mi.itemName ASC;
        `;
        const result = await db.query(query, [userID]);
        return result.rows;
    }
 
    static async getOrderQueue(userID: number) {
        const query = `
            SELECT o.orderID, o.orderDate, o.deliveryType, o.status, o.userID
            FROM \`Order\` o
            WHERE o.status NOT IN ('Delivered', 'Cancelled')
            ORDER BY o.orderDate ASC;
        `;
        const result = await db.query(query, []);
        return result.rows;
    }
 
    static async updateOrderStatus(orderID: number, newStatus: string) {
        const result = await db.query(
            "UPDATE `Order` SET status = $1 WHERE orderID = $2 RETURNING orderID, status",
            [newStatus, orderID]
        );
        return result.rows[0];
    }
}