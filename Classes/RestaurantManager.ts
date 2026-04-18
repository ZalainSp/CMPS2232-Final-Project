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
    
    }

    static async getById(userID: number) {
    
    }

    static async add(username: string, email: string, contactNumber: string, restaurantID: number, restaurantName: string, openingHours: string) {
  
    }

    static async updateRestaurantInfo(userID: number, restaurantName: string, openingHours: string) {
   
    }

    static async getMenu(userID: number) {
 
    }

    static async getOrderQueue(userID: number) {
   
    }

    static async updateOrderStatus(orderID: number, newStatus: string) {
   
    }
}