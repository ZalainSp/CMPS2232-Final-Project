import { User } from "./User";

export abstract class DriverDef extends User {
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

    getRole(): string { return "Driver"; }
    getDriverID(): number { return this.driverID; }
    getVehicleType(): string { return this.vehicleType; }
    isAvailable(): boolean { return this.available; }
    setAvailability(available: boolean): void { this.available = available; }
    setVehicleType(vehicleType: string): void { this.vehicleType = vehicleType; }

    static async getAll() {
        
    }

    static async getById(userID: number) {
       
    }

    static async getAvailable() {
        
    }

    static async add(username: string, email: string, contactNumber: string, driverID: number, vehicleType: string) {
        
    }

    static async setAvailability(userID: number, available: boolean) {
        
    }

    static async acceptDelivery(userID: number, orderID: number) {
        
    }

    static async updateDeliveryStatus(orderID: number, status: string) {
        
    }
}