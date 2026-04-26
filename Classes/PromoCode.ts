import db from "../DB/dbConnection";

export abstract class PromoCodeDef {
  protected code!: string;
  protected discountPercent!: number;
  protected active!: boolean;

  abstract getCode(): string;
  abstract getDiscountPercent(): number;
  abstract isActive(): boolean;
  abstract deactivate(): void;
}

export class PromoCode extends PromoCodeDef {
  constructor(code: string, discountPercent: number, active: boolean) {
    super();
    this.code = code;
    this.discountPercent = discountPercent;
    this.active = active;
  }

  getCode(): string {
    return this.code;
  }
  getDiscountPercent(): number {
    return this.discountPercent;
  }
  isActive(): boolean {
    return this.active;
  }
  deactivate(): void {
    this.active = false;
  }

  static async getAll() {
    const result = await db.query(
      `SELECT code, discountPercent AS "discountPercent", active
             FROM PromoCode
             ORDER BY code ASC`,
    );
    return result.rows;
  }

  static async getByCode(code: string) {
    const result = await db.query(
      `SELECT code, discountPercent AS "discountPercent", active
             FROM PromoCode
             WHERE code = $1`,
      [code.toUpperCase()],
    );
    return result.rows[0] || null;
  }

  static async add(
    code: string,
    discountPercent: number,
    active: boolean = true,
  ) {
    const result = await db.query(
      `INSERT INTO PromoCode (code, discountPercent, active)
             VALUES ($1, $2, $3)
             RETURNING code, discountPercent AS "discountPercent", active`,
      [code.toUpperCase(), discountPercent, active],
    );
    return result.rows[0];
  }

  static async deactivate(code: string) {
    const result = await db.query(
      `UPDATE PromoCode SET active = false WHERE code = $1
             RETURNING code, active`,
      [code.toUpperCase()],
    );
    return result.rows[0] || null;
  }

  static async validate(
    code: string,
    subtotal: number,
  ): Promise<{
    valid: boolean;
    discount: number;
    discountPercent: number;
    message: string;
  }> {
    if (!code || code.trim() === "") {
      return {
        valid: false,
        discount: 0,
        discountPercent: 0,
        message: "No promo code provided",
      };
    }

    const promo = await PromoCode.getByCode(code.trim().toUpperCase());

    if (!promo) {
      return {
        valid: false,
        discount: 0,
        discountPercent: 0,
        message: "Invalid promo code",
      };
    }

    if (!promo.active) {
      return {
        valid: false,
        discount: 0,
        discountPercent: 0,
        message: "Promo code is no longer active",
      };
    }

    const discountPercent = parseFloat(promo.discountPercent);
    const discount = parseFloat(
      (subtotal * (discountPercent / 100)).toFixed(2),
    );

    return {
      valid: true,
      discount,
      discountPercent,
      message: `${discountPercent}% discount applied`,
    };
  }
}
