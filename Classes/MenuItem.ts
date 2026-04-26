import db from "../DB/dbConnection";

export abstract class MenuItemDef {
  protected itemID!: number;
  protected itemName!: string;
  protected basePrice!: number;
  protected available!: boolean;

  abstract getPrice(): number;
  abstract getDescription(): string;

  abstract getItemID(): number;
  abstract getItemName(): string;
  abstract isAvailable(): boolean;
  abstract setBasePrice(price: number): void;
  abstract toggleAvailability(): void;
}

export class MenuItem extends MenuItemDef {
  constructor(
    itemID: number,
    itemName: string,
    basePrice: number,
    available: boolean,
  ) {
    super();
    this.itemID = itemID;
    this.itemName = itemName;
    this.basePrice = basePrice;
    this.available = available;
  }

  getPrice(): number {
    return this.basePrice;
  }
  getDescription(): string {
    return `${this.itemName} - $${this.basePrice.toFixed(2)}`;
  }
  getItemID(): number {
    return this.itemID;
  }
  getItemName(): string {
    return this.itemName;
  }
  isAvailable(): boolean {
    return this.available;
  }
  setBasePrice(price: number): void {
    this.basePrice = price;
  }
  toggleAvailability(): void {
    this.available = !this.available;
  }

  static async getAll() {
    const query = `
            SELECT
                mi.itemID AS "itemID",
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
                cm.discountAmount AS "discountAmount"
            FROM MenuItem mi
            LEFT JOIN FoodItem fi ON mi.itemID = fi.itemID
            LEFT JOIN DrinkItem di ON mi.itemID = di.itemID
            LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
            ORDER BY mi.itemName ASC;
        `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getById(itemID: number) {
    const query = `
            SELECT
                mi.itemID AS "itemID",
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
                cm.discountAmount AS "discountAmount"
            FROM MenuItem mi
            LEFT JOIN FoodItem fi ON mi.itemID = fi.itemID
            LEFT JOIN DrinkItem di ON mi.itemID = di.itemID
            LEFT JOIN ComboMeal cm ON mi.itemID = cm.itemID
            WHERE mi.itemID = $1;
        `;
    const result = await db.query(query, [itemID]);
    return result.rows[0] || null;
  }

  static async updatePrice(itemID: number, basePrice: number) {
    const result = await db.query(
      'UPDATE MenuItem SET basePrice = $1 WHERE itemID = $2 RETURNING itemID, basePrice AS "basePrice"',
      [basePrice, itemID],
    );
    return result.rows[0];
  }

  static async toggleAvailability(itemID: number) {
    const result = await db.query(
      `UPDATE MenuItem
             SET isAvailable = NOT isAvailable
             WHERE itemID = $1
             RETURNING itemID, isAvailable AS "isAvailable"`,
      [itemID],
    );
    return result.rows[0];
  }

  static async delete(itemID: number) {
    const result = await db.query(
      "DELETE FROM MenuItem WHERE itemID = $1 RETURNING itemID",
      [itemID],
    );
    return result.rows[0];
  }
}
