import db from "../DB/dbConnection";
import { MenuItem } from "./MenuItem";

export abstract class FoodItemDef extends MenuItem {
  protected portionSize!: string;

  abstract getPortionSize(): string;
  abstract setPortionSize(size: string): void;
}

export class FoodItem extends FoodItemDef {
  constructor(
    itemID: number,
    itemName: string,
    basePrice: number,
    available: boolean,
    portionSize: string,
  ) {
    super(itemID, itemName, basePrice, available);
    this.portionSize = portionSize;
  }

  getPrice(): number {
    return this.basePrice;
  }
  getDescription(): string {
    return `${this.itemName} (${this.portionSize}) - $${this.basePrice.toFixed(2)}`;
  }
  getPortionSize(): string {
    return this.portionSize;
  }
  setPortionSize(size: string): void {
    this.portionSize = size;
  }

  static async getAll() {
    const query = `
            SELECT
                mi.itemID AS "itemID",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                mi.isAvailable AS "isAvailable",
                fi.portionSize AS "portionSize"
            FROM MenuItem mi
            JOIN FoodItem fi ON mi.itemID = fi.itemID
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
                fi.portionSize AS "portionSize"
            FROM MenuItem mi
            JOIN FoodItem fi ON mi.itemID = fi.itemID
            WHERE mi.itemID = $1;
        `;
    const result = await db.query(query, [itemID]);
    return result.rows[0] || null;
  }

  static async add(
    itemName: string,
    basePrice: number,
    available: boolean,
    portionSize: string,
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
        "INSERT INTO FoodItem (itemID, portionSize) VALUES ($1, $2)",
        [itemID, portionSize],
      );

      await client.query("COMMIT");
      return {
        itemID,
        itemName,
        basePrice,
        isAvailable: available,
        portionSize,
        type: "food",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updatePortionSize(itemID: number, portionSize: string) {
    const result = await db.query(
      `UPDATE FoodItem SET portionSize = $1 WHERE itemID = $2
             RETURNING itemID, portionSize AS "portionSize"`,
      [portionSize, itemID],
    );
    return result.rows[0];
  }
}
