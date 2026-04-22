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
    constructor(
        code: string,
        discountPercent: number,
        active: boolean
    ) {
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
        return [];
    }

    static async getByCode(code: string) {
        return null;
    }

    static async add(code: string, discountPercent: number, active: boolean = true) {
        return true;
    }

    static async deactivate(code: string) {
        return true;
    }

    static async validate(
    code: string,
    subtotal: number
    ): Promise<{ valid: boolean; discount: number; message: string }> {

        const result = {
            valid: false,
            discount: 0,
            message: "Not implemented yet"
        };

        return result;
    }
}