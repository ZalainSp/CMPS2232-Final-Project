export abstract class CartDef {
    protected userID!: number;

    abstract getUserID(): number;
    abstract addItem(itemID: number): Promise<any>;
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

    getUserID(): number { return this.userID; }

    async addItem(itemID: number) {
        return Cart.addItem(this.userID, itemID);
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
      
    }

    static async addItem(userID: number, itemID: number) {
        
    }

    static async removeItem(userID: number, itemID: number) {
       
    }

    static async clear(userID: number) {
        
    }

    static async calculateSubtotal(userID: number): Promise<number> {
        
    }

    static async isEmpty(userID: number): Promise<boolean> {
        
    }
}