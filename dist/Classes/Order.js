"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orders = exports.OrdersDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const Cart_1 = require("./Cart");
const PromoCode_1 = require("./PromoCode");
const TAX_RATE = 0.125;
const STANDARD_FEE = 5.0;
const PRIORITY_FEE = 10.0;
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
    getOrderID() {
        return this.orderID;
    }
    getOrderDate() {
        return this.orderDate;
    }
    getDeliveryType() {
        return this.deliveryType;
    }
    getStatus() {
        return this.status;
    }
    getUserID() {
        return this.userID;
    }
    getDriverID() {
        return this.driverID;
    }
    setStatus(status) {
        this.status = status;
    }
    setDriverID(driverID) {
        this.driverID = driverID;
    }
    static async getAll() {
        const query = `
            SELECT
                o.orderID AS "orderID",
                o.orderDate AS "orderDate",
                o.deliveryType AS "deliveryType",
                o.status AS "status",
                o.customerID AS "customerID",
                o.driverID AS "driverID",
                u.username AS "customerName"
            FROM Orders o
            LEFT JOIN Customer c ON o.customerID = c.userID
            LEFT JOIN Users u ON c.userID = u.userID
            ORDER BY o.orderDate DESC;
        `;
        const result = await dbConnection_1.default.query(query);
        return result.rows;
    }
    static async getById(orderID) {
        const query = `
            SELECT
                o.orderID AS "orderID",
                o.orderDate AS "orderDate",
                o.deliveryType AS "deliveryType",
                o.status AS "status",
                o.customerID AS "customerID",
                o.driverID AS "driverID",
                u.username AS "customerName",
                c.deliveryAddress AS "deliveryAddress"
            FROM Orders o
            LEFT JOIN Customer c ON o.customerID = c.userID
            LEFT JOIN Users u ON c.userID = u.userID
            WHERE o.orderID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [orderID]);
        return result.rows[0] || null;
    }
    static async getByCustomer(userID) {
        const query = `
            SELECT
                o.orderID AS "orderID",
                o.orderDate AS "orderDate",
                o.deliveryType AS "deliveryType",
                o.status AS "status",
                o.driverID AS "driverID"
            FROM Orders o
            WHERE o.customerID = $1
            ORDER BY o.orderDate DESC;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return result.rows;
    }
    static async getItems(orderID) {
        const query = `
            SELECT
                oi.itemID AS "itemID",
                oi.quantity AS "quantity",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                CASE
                    WHEN fi.itemID IS NOT NULL THEN 'food'
                    WHEN di.itemID IS NOT NULL THEN 'drink'
                    WHEN cm.itemID IS NOT NULL THEN 'combo'
                    ELSE 'item'
                END AS type,
                fi.portionSize AS "portionSize",
                di.cupSize AS "cupSize",
                cm.discountAmount AS "discountAmount",
                CASE
                    WHEN cm.itemID IS NOT NULL
                        THEN GREATEST(0, mi.basePrice - cm.discountAmount) * oi.quantity
                    ELSE mi.basePrice * oi.quantity
                END AS "lineTotal"
            FROM OrderItem oi
            JOIN MenuItem mi ON oi.itemID = mi.itemID
            LEFT JOIN FoodItem fi ON mi.itemID = fi.itemID
            LEFT JOIN DrinkItem di ON mi.itemID = di.itemID
            LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
            WHERE oi.orderID = $1;
        `;
        const result = await dbConnection_1.default.query(query, [orderID]);
        return result.rows;
    }
    static async placeOrders(userID, deliveryType, promoCode = null) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            //get cart items
            const cartItems = await Cart_1.Cart.getItems(userID);
            if (!cartItems || cartItems.length === 0) {
                await client.query("ROLLBACK");
                return { success: false, message: "Cart is empty" };
            }
            //calculate subtotal
            const subtotal = await Cart_1.Cart.calculateSubtotal(userID);
            //validate promo
            let discount = 0;
            if (promoCode) {
                const promoResult = await PromoCode_1.PromoCode.validate(promoCode, subtotal);
                if (promoResult.valid) {
                    discount = promoResult.discount;
                }
            }
            //delivery fee
            const deliveryFee = deliveryType === "priority" ? PRIORITY_FEE : STANDARD_FEE;
            //tax on (subtotal - discount)
            const taxableAmount = subtotal - discount;
            const tax = parseFloat((taxableAmount * TAX_RATE).toFixed(2));
            const total = parseFloat((taxableAmount + tax + deliveryFee).toFixed(2));
            //insert order
            const orderRes = await client.query(`INSERT INTO Orders (deliveryType, status, customerID)
                 VALUES ($1, 'Pending', $2)
                 RETURNING orderID AS "orderID", orderDate AS "orderDate"`, [deliveryType, userID]);
            const { orderID, orderDate } = orderRes.rows[0];
            //insert order items from cart
            for (const item of cartItems) {
                await client.query("INSERT INTO OrderItem (orderID, itemID, quantity) VALUES ($1, $2, $3)", [orderID, item.itemID, item.quantity]);
            }
            //clear cart
            await client.query("DELETE FROM CartItem WHERE userID = $1", [userID]);
            await client.query("COMMIT");
            return {
                success: true,
                order: {
                    orderID,
                    orderDate,
                    deliveryType,
                    status: "Pending",
                    customerID: userID,
                    subtotal,
                    discount,
                    tax,
                    deliveryFee,
                    total,
                },
            };
        }
        catch (error) {
            await client.query("ROLLBACK");
            return { success: false, message: error.message };
        }
        finally {
            client.release();
        }
    }
    static async assignDriver(orderID, driverID) {
        const client = await dbConnection_1.default.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query(`UPDATE Orders SET driverID = $1, status = 'Out for Delivery'
                 WHERE orderID = $2
                 RETURNING orderID AS "orderID", status, driverID AS "driverID"`, [driverID, orderID]);
            await client.query("UPDATE Driver SET available = FALSE WHERE userID = $1", [driverID]);
            await client.query("COMMIT");
            return result.rows[0];
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async updateStatus(orderID, status) {
        const result = await dbConnection_1.default.query(`UPDATE Orders SET status = $1 WHERE orderID = $2
             RETURNING orderID AS "orderID", status`, [status, orderID]);
        //if delivered, free the driver
        if (status === "Delivered") {
            const order = result.rows[0];
            if (order) {
                const orderFull = await Orders.getById(orderID);
                if (orderFull?.driverID) {
                    await dbConnection_1.default.query("UPDATE Driver SET available = TRUE WHERE userID = $1", [orderFull.driverID]);
                }
            }
        }
        return result.rows[0];
    }
    static async generateReceipt(orderID) {
        const order = await Orders.getById(orderID);
        if (!order)
            return null;
        const items = await Orders.getItems(orderID);
        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.lineTotal), 0);
        const deliveryFee = order.deliveryType === "priority" ? PRIORITY_FEE : STANDARD_FEE;
        const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
        const total = parseFloat((subtotal + tax + deliveryFee).toFixed(2));
        return {
            orderID: order.orderID,
            orderDate: order.orderDate,
            customerName: order.customerName,
            deliveryAddress: order.deliveryAddress,
            deliveryType: order.deliveryType,
            status: order.status,
            items,
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax,
            deliveryFee,
            total,
        };
    }
    static async getActiveByCustomer(userID) {
        const query = `
            SELECT orderID AS "orderID", status
            FROM Orders
            WHERE customerID = $1
              AND status NOT IN ('Delivered', 'Cancelled')
            ORDER BY orderDate DESC
            LIMIT 1;
        `;
        const result = await dbConnection_1.default.query(query, [userID]);
        return result.rows[0] || null;
    }
    static async getPlatformStats() {
        const query = `
            SELECT
                COUNT(*) AS "totalOrders",
                COUNT(CASE WHEN status = 'Delivered' THEN 1 END) AS "completedOrders",
                COUNT(CASE WHEN status NOT IN ('Delivered','Cancelled') THEN 1 END) AS "activeOrders"
            FROM Orders;
        `;
        const result = await dbConnection_1.default.query(query);
        return result.rows[0];
    }
}
exports.Orders = Orders;
