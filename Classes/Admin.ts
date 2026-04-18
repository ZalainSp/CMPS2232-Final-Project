import { User } from "./User";

export abstract class AdminDef extends User {
    protected roleTitle!: string;

    abstract getRoleTitle(): string;
    abstract setRoleTitle(roleTitle: string): void;
}

export class Admin extends AdminDef {
    constructor(
        userID: number,
        username: string,
        email: string,
        contactNumber: string,
        roleTitle: string
    ) {
        super(userID, username, email, contactNumber);
        this.roleTitle = roleTitle;
    }

    getRole(): string { return "Admin"; }
    getRoleTitle(): string { return this.roleTitle; }
    setRoleTitle(roleTitle: string): void { this.roleTitle = roleTitle; }

    static async getAll() {
        
    }

    static async getById(userID: number) {
        
    }

    static async add(username: string, email: string, contactNumber: string, roleTitle: string) {
        
    }

    static async removeUser(targetUserID: number) {
       
    }

    static async generateOrderReport(allOrders: any[]) {
        
    }
}