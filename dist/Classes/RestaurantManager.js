"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantManager = exports.RestaurantManagerDef = void 0;
const dbConnection_1 = __importDefault(require("../DB/dbConnection"));
const Users_1 = require("./Users");
class RestaurantManagerDef extends Users_1.Users {}
exports.RestaurantManagerDef = RestaurantManagerDef;
class RestaurantManager extends RestaurantManagerDef {
  constructor(
    userID,
    username,
    email,
    contactNumber,
    restaurantID,
    restaurantName,
    openingHours,
  ) {
    super(userID, username, email, contactNumber);
    this.restaurantID = restaurantID;
    this.restaurantName = restaurantName;
    this.openingHours = openingHours;
  }
  getRole() {
    return "RestaurantManager";
  }
  getRestaurantID() {
    return this.restaurantID;
  }
  getRestaurantName() {
    return this.restaurantName;
  }
  getOpeningHours() {
    return this.openingHours;
  }
  setRestaurantName(name) {
    this.restaurantName = name;
  }
  setOpeningHours(hours) {
    this.openingHours = hours;
  }
  static async getAll() {
    const query = `
      SELECT u.userID, u.username, u.email, u.contactNumber,
             rm.restaurantID, rm.restaurantName, rm.openingHours
      FROM Users u
      JOIN RestaurantManager rm ON u.userID = rm.userID
      ORDER BY rm.restaurantName ASC;
    `;
    const result = await dbConnection_1.default.query(query);
    return result.rows;
  }
  static async getById(userID) {
    const query = `
      SELECT u.userID, u.username, u.email, u.contactNumber,
             rm.restaurantID, rm.restaurantName, rm.openingHours
      FROM Users u
      JOIN RestaurantManager rm ON u.userID = rm.userID
      WHERE u.userID = $1;
    `;
    const result = await dbConnection_1.default.query(query, [userID]);
    return result.rows[0] || null;
  }
  static async add(
    username,
    email,
    contactNumber,
    restaurantName,
    openingHours,
  ) {
    const client = await dbConnection_1.default.connect();
    try {
      await client.query("BEGIN");
      const usersRes = await client.query(
        "INSERT INTO Users (username, email, contactNumber) VALUES ($1, $2, $3) RETURNING userID",
        [username, email, contactNumber],
      );
      const userID = usersRes.rows[0].userid ?? usersRes.rows[0].userID;
      const rmRes = await client.query(
        `INSERT INTO RestaurantManager (userID, restaurantName, openingHours)
         VALUES ($1, $2, $3) RETURNING restaurantID`,
        [userID, restaurantName, openingHours],
      );
      const restaurantID =
        rmRes.rows[0]?.restaurantid ?? rmRes.rows[0]?.restaurantID ?? null;
      await client.query("COMMIT");
      return {
        userID,
        username,
        email,
        contactNumber,
        restaurantID,
        restaurantName,
        openingHours,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  static async updateRestaurantInfo(userID, restaurantName, openingHours) {
    const result = await dbConnection_1.default.query(
      "UPDATE RestaurantManager SET restaurantName = $1, openingHours = $2 WHERE userID = $3 RETURNING userID",
      [restaurantName, openingHours, userID],
    );
    return result.rows[0] || null;
  }
  static async getMenu(userID) {
    const query = `
      SELECT mi.itemID        AS "itemID",
             mi.itemName      AS "itemName",
             mi.basePrice     AS "basePrice",
             mi.isAvailable   AS "isAvailable",
             mi.restaurantID  AS "restaurantID",
             CASE
               WHEN fi.itemID IS NOT NULL THEN 'food'
               WHEN di.itemID IS NOT NULL THEN 'drink'
               WHEN cm.itemID IS NOT NULL THEN 'combo'
               ELSE 'item'
             END AS type,
             fi.portionSize    AS "portionSize",
             di.cupSize        AS "cupSize",
             cm.discountAmount AS "discountAmount"
      FROM MenuItem mi
      JOIN RestaurantManager rm ON rm.userID = $1
                                AND rm.restaurantID = mi.restaurantID
      LEFT JOIN FoodItem  fi ON mi.itemID = fi.itemID
      LEFT JOIN DrinkItem di ON mi.itemID = di.itemID
      LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
      ORDER BY mi.itemName ASC;
    `;
    const result = await dbConnection_1.default.query(query, [userID]);
    return result.rows;
  }
  static async getOrdersQueue(userID) {
    const query = `
      SELECT o.orderID      AS "orderID",
             o.orderDate    AS "orderDate",
             o.deliveryType AS "deliveryType",
             o.status       AS "status",
             o.customerID   AS "customerID",
             o.restaurantID AS "restaurantID",
             u.username     AS "customerName"
      FROM Orders o
      JOIN RestaurantManager rm ON rm.userID = $1
                                AND rm.restaurantID = o.restaurantID
      LEFT JOIN Customer c ON o.customerID = c.userID
      LEFT JOIN Users u    ON c.userID     = u.userID
      WHERE o.status NOT IN ('Delivered', 'Cancelled')
      ORDER BY o.orderDate ASC;
    `;
    const result = await dbConnection_1.default.query(query, [userID]);
    return result.rows;
  }
  static async updateOrderstatus(orderID, newStatus) {
    const result = await dbConnection_1.default.query(
      `UPDATE Orders SET status = $1 WHERE orderID = $2
       RETURNING orderID AS "orderID", status`,
      [newStatus, orderID],
    );
    return result.rows[0] || null;
  }
  static async getRevenueToday(userID) {
    const query = `
      SELECT COALESCE(SUM(
        CASE
          WHEN cm.itemID IS NOT NULL
            THEN GREATEST(0, mi.basePrice - cm.discountAmount) * oi.quantity
          ELSE mi.basePrice * oi.quantity
        END
      ), 0) AS revenue
      FROM Orders o
      JOIN RestaurantManager rm ON rm.userID = $1
                                AND rm.restaurantID = o.restaurantID
      JOIN OrderItem oi ON o.orderID = oi.orderID
      JOIN MenuItem  mi ON oi.itemID  = mi.itemID
      LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
      WHERE o.status = 'Delivered'
        AND DATE(o.orderDate) = CURRENT_DATE;
    `;
    const result = await dbConnection_1.default.query(query, [userID]);
    return parseFloat(result.rows[0].revenue) || 0;
  }
}
exports.RestaurantManager = RestaurantManager;
