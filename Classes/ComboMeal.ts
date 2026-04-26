import db from "../DB/dbConnection";
import { MenuItem } from "./MenuItem";

export abstract class ComboMealDef extends MenuItem {
  protected discountAmount!: number;

  abstract getDiscountAmount(): number;
  abstract setDiscountAmount(amount: number): void;
  abstract calculateSavings(): number;
}

export class ComboMeal extends ComboMealDef {
  constructor(
    itemID: number,
    itemName: string,
    basePrice: number,
    available: boolean,
    discountAmount: number,
  ) {
    super(itemID, itemName, basePrice, available);
    this.discountAmount = discountAmount;
  }

  getPrice(): number {
    return Math.max(0, this.basePrice - this.discountAmount);
  }
  getDescription(): string {
    return `${this.itemName} (Combo) - $${this.getPrice().toFixed(2)} (Save $${this.discountAmount.toFixed(2)})`;
  }
  getDiscountAmount(): number {
    return this.discountAmount;
  }
  setDiscountAmount(amount: number): void {
    this.discountAmount = amount;
  }
  calculateSavings(): number {
    return this.discountAmount;
  }

  static async getAll() {
    const query = `
            SELECT
                mi.itemID AS "itemID",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                mi.isAvailable AS "isAvailable",
                cm.discountAmount AS "discountAmount",
                (mi.basePrice - cm.discountAmount) AS "finalPrice"
            FROM MenuItem mi
            JOIN ComboMeal cm ON mi.itemID = cm.itemID
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
                cm.discountAmount AS "discountAmount",
                (mi.basePrice - cm.discountAmount) AS "finalPrice"
            FROM MenuItem mi
            JOIN ComboMeal cm ON mi.itemID = cm.itemID
            WHERE mi.itemID = $1;
        `;
    const result = await db.query(query, [itemID]);
    return result.rows[0] || null;
  }

  static async add(
    itemName: string,
    basePrice: number,
    available: boolean,
    discountAmount: number,
  ) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const miRes = await client.query(
        `INSERT INTO MenuItem (itemName, basePrice, isAvailable)
                 VALUES ($1, $2, $3)
                 RETURNING itemID AS "itemID"`,
        [itemName, basePrice, available],
      );
      const itemID = miRes.rows[0].itemID;

      await client.query(
        "INSERT INTO ComboMeal (itemID, discountAmount) VALUES ($1, $2)",
        [itemID, discountAmount],
      );

      await client.query("COMMIT");
      return {
        itemID,
        itemName,
        basePrice,
        isAvailable: available,
        discountAmount,
        finalPrice: basePrice - discountAmount,
        type: "combo",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateDiscount(itemID: number, discountAmount: number) {
    const result = await db.query(
      `UPDATE ComboMeal SET discountAmount = $1 WHERE itemID = $2
             RETURNING itemID, discountAmount AS "discountAmount"`,
      [discountAmount, itemID],
    );
    return result.rows[0];
  }
}
