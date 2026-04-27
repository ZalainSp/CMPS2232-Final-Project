import db from "../DB/dbConnection";
import { MenuItem } from "./MenuItem";

export abstract class DrinkItemDef extends MenuItem {
  protected cupSize!: string;

  abstract getCupSize(): string;
  abstract setCupSize(size: string): void;
}

export class DrinkItem extends DrinkItemDef {
  constructor(
    itemID: number,
    itemName: string,
    basePrice: number,
    available: boolean,
    cupSize: string,
  ) {
    super(itemID, itemName, basePrice, available);
    this.cupSize = cupSize;
  }

  getPrice(): number {
    return this.basePrice;
  }
  getDescription(): string {
    return `${this.itemName} (${this.cupSize}) - $${this.basePrice.toFixed(2)}`;
  }
  getCupSize(): string {
    return this.cupSize;
  }
  setCupSize(size: string): void {
    this.cupSize = size;
  }

  static async getAll() {
    const query = `
            SELECT
                mi.itemID AS "itemID",
                mi.itemName AS "itemName",
                mi.basePrice AS "basePrice",
                mi.isAvailable AS "isAvailable",
                di.cupSize AS "cupSize"
            FROM MenuItem mi
            JOIN DrinkItem di ON mi.itemID = di.itemID
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
                di.cupSize AS "cupSize"
            FROM MenuItem mi
            JOIN DrinkItem di ON mi.itemID = di.itemID
            WHERE mi.itemID = $1;
        `;
    const result = await db.query(query, [itemID]);
    return result.rows[0] || null;
  }

  static async add(
    itemName: string,
    basePrice: number,
    available: boolean,
    cupSize: string,
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
        "INSERT INTO DrinkItem (itemID, cupSize) VALUES ($1, $2)",
        [itemID, cupSize],
      );

      await client.query("COMMIT");
      return {
        itemID,
        itemName,
        basePrice,
        isAvailable: available,
        cupSize,
        type: "drink",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateCupSize(itemID: number, cupSize: string) {
    const result = await db.query(
      `UPDATE DrinkItem SET cupSize = $1 WHERE itemID = $2
             RETURNING itemID, cupSize AS "cupSize"`,
      [cupSize, itemID],
    );
    return result.rows[0];
  }
}
