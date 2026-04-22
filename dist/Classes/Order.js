"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orders = exports.OrdersDef = void 0;
const TAX_RATE = 0.125;
const STANDARD_FEE = 5.00;
const PRIORITY_FEE = 10.00;
class OrdersDef {
}
exports.OrdersDef = OrdersDef;
class Orders extends OrdersDef {
    constructor(orderID, orderDate, deliveryType, status, userID, driverID = null) {
        super();
        this.orderID = orderID;
        this.orderDate = orderDate;
        this.deliveryType = deliveryType;
        this.status = status;
        this.userID = userID;
        this.driverID = driverID;
    }
    getOrderID() { return this.orderID; }
    getOrderDate() { return this.orderDate; }
    getDeliveryType() { return this.deliveryType; }
    getStatus() { return this.status; }
    getUserID() { return this.userID; }
    getDriverID() { return this.driverID; }
    setStatus(status) { this.status = status; }
    setDriverID(driverID) { this.driverID = driverID; }
    static async getAll() {
    }
    static async getById(orderID) {
    }
    static async getByCustomer(userID) {
    }
    static async getItems(orderID) {
    }
    static async placeOrders(userID, deliveryType, promoCode = null) {
    }
    static async assignDriver(orderID, driverID) {
    }
    static async updateStatus(orderID, status) {
    }
    static async generateReceipt(orderID) {
    }
}
exports.Orders = Orders;
