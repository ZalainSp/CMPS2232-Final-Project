import { User } from "./User";

export abstract class CustomerDef extends User {
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

    getRole(): string { return "Customer"; }
    getDeliveryAddress(): string { return this.deliveryAddress; }
    getUserStatus(): string { return this.userStatus; }
    setDeliveryAddress(address: string): void { this.deliveryAddress = address; }
    setUserStatus(status: string): void { this.userStatus = status; }

    static async getAll() {
        
    }

    static async add(username: string, email: string, contactNumber: string, deliveryAddress: string, userStatus: string) {
        
    }

    static async updateDeliveryAddress(userID: number, address: string) {
       
    }

    static async getOrderHistory(userID: number) {
      
    }

    static async trackOrderStatus(orderID: number) {
        
    }
}