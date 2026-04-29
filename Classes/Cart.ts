import db from "../DB/dbConnection";

export abstract class CartDef {
  protected userID!: number;

  abstract getUserID(): number;
  abstract addItem(itemID: number, quantity?: number): Promise<any>;
  abstract removeItem(itemID: number): Promise<any>;
  abstract clear(): Promise<any>;
  abstract getItems(): Promise<any[]>;
  abstract calculateSubtotal(): Promise<number>;
  abstract isEmpty(): Promise<boolean>;
}

export class Cart extends CartDef {
  constructor(userID: number) {
    super();
    this.userID = userID;
  }

  getUserID(): number {
    return this.userID;
  }
  async addItem(itemID: number, quantity = 1) {
    return Cart.addItem(this.userID, itemID, quantity);
  }
  async removeItem(itemID: number) {
    return Cart.removeItem(this.userID, itemID);
  }
  async clear() {
    return Cart.clear(this.userID);
  }
  async getItems() {
    return Cart.getItems(this.userID);
  }
  async calculateSubtotal() {
    return Cart.calculateSubtotal(this.userID);
  }
  async isEmpty() {
    return Cart.isEmpty(this.userID);
  }

  static async getItems(userID: number) {
    const query = `
            SELECT
                ci.itemID AS "itemID",
                ci.quantity AS "quantity",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                mi.isAvailable AS "isAvailable",
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
                        THEN GREATEST(0, mi.basePrice - cm.discountAmount) * ci.quantity
                    ELSE mi.basePrice * ci.quantity
                END AS "lineTotal"
            FROM CartItem ci
            JOIN MenuItem mi ON ci.itemID = mi.itemID
            LEFT JOIN FoodItem fi ON mi.itemID = fi.itemID
            LEFT JOIN DrinkItem di ON mi.itemID = di.itemID
            LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
            WHERE ci.userID = $1
            ORDER BY mi.itemName ASC;
        `;
    const result = await db.query(query, [userID]);
    return result.rows;
  }

  static async addItem(
    userID: number,
    itemID: number,
    quantity = 1,
  ): Promise<any> {
    await db.query("INSERT INTO Cart (userID) VALUES ($1) ON CONFLICT (userID) DO NOTHING", [userID]);

    //increase quantity if already in cart
    const result = await db.query(
      `INSERT INTO CartItem (userID, itemID, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (userID, itemID)
             DO UPDATE SET quantity = CartItem.quantity + EXCLUDED.quantity
             RETURNING userID, itemID, quantity`,
      [userID, itemID, quantity],
    );
    return result.rows[0];
  }

  static async removeItem(userID: number, itemID: number): Promise<any> {
    const result = await db.query(
      "DELETE FROM CartItem WHERE userID = $1 AND itemID = $2 RETURNING itemID",
      [userID, itemID],
    );
    return result.rows[0] || null;
  }

  static async updateQuantity(
    userID: number,
    itemID: number,
    quantity: number,
  ): Promise<any> {
    if (quantity <= 0) return Cart.removeItem(userID, itemID);
    const result = await db.query(
      `UPDATE CartItem SET quantity = $1 WHERE userID = $2 AND itemID = $3
             RETURNING userID, itemID, quantity`,
      [quantity, userID, itemID],
    );
    return result.rows[0] || null;
  }

  static async clear(userID: number): Promise<any> {
    await db.query("DELETE FROM CartItem WHERE userID = $1", [userID]);
    return { success: true };
  }

  static async calculateSubtotal(userID: number): Promise<number> {
    const query = `
            SELECT COALESCE(SUM(
                CASE
                    WHEN cm.itemID IS NOT NULL
                        THEN GREATEST(0, mi.basePrice - cm.discountAmount) * ci.quantity
                    ELSE mi.basePrice * ci.quantity
                END
            ), 0) AS subtotal
            FROM CartItem ci
            JOIN MenuItem mi ON ci.itemID = mi.itemID
            LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
            WHERE ci.userID = $1;
        `;
    const result = await db.query(query, [userID]);
    return parseFloat(result.rows[0].subtotal);
  }

  static async isEmpty(userID: number): Promise<boolean> {
    const result = await db.query(
      "SELECT COUNT(*) AS cnt FROM CartItem WHERE userID = $1",
      [userID],
    );
    return parseInt(result.rows[0].cnt, 10) === 0;
  }

  static async getCount(userID: number): Promise<number> {
    const result = await db.query(
      "SELECT COALESCE(SUM(quantity), 0) AS cnt FROM CartItem WHERE userID = $1",
      [userID],
    );
    return parseInt(result.rows[0].cnt, 10);
  }
}
