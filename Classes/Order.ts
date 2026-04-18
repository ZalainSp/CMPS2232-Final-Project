const TAX_RATE = 0.125;
const STANDARD_FEE = 3.00;
const PRIORITY_FEE = 7.00;

export abstract class OrderDef {
    protected orderID!: number;
    protected orderDate!: string;
    protected deliveryType!: string;
    protected status!: string;
    protected userID!: number;
    protected driverID!: number | null;

    abstract getOrderID(): number;
    abstract getOrderDate(): string;
    abstract getDeliveryType(): string;
    abstract getStatus(): string;
    abstract getUserID(): number;
    abstract getDriverID(): number | null;

    abstract setStatus(status: string): void;
    abstract setDriverID(driverID: number): void;
}

export class Order extends OrderDef {
    constructor(
        orderID: number,
        orderDate: string,
        deliveryType: string,
        status: string,
        userID: number,
        driverID: number | null = null
    ) {
        super();
        this.orderID = orderID;
        this.orderDate = orderDate;
        this.deliveryType = deliveryType;
        this.status = status;
        this.userID = userID;
        this.driverID = driverID;
    }

    getOrderID(): number { return this.orderID; }
    getOrderDate(): string { return this.orderDate; }
    getDeliveryType(): string { return this.deliveryType; }
    getStatus(): string { return this.status; }
    getUserID(): number { return this.userID; }
    getDriverID(): number | null { return this.driverID; }

    setStatus(status: string): void { this.status = status; }
    setDriverID(driverID: number): void { this.driverID = driverID; }

    static async getAll() {
      
    }

    static async getById(orderID: number) {
        
    }

    static async getByCustomer(userID: number) {
        
    }

    static async getItems(orderID: number) {
      
    }

    static async placeOrder(userID: number, deliveryType: string, promoCode: string | null = null) {
        
        
    }

    static async assignDriver(orderID: number, driverID: number) {
       
    }

    static async updateStatus(orderID: number, status: string) {
     
    }

    static async generateReceipt(orderID: number) {
      
    }
}