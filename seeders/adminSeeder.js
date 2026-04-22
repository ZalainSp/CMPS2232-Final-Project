const db = require("../dist/DB/dbConnection");
const crypto = require("crypto");

function hashPassword(password, salt) {
    return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

async function run() {
    const username = "admin_gen";
    const email = "admin@gobites.bz";
    const contact = "+5016000001";

    const password = "Admin123";
    const salt = "fixed_salt_admin";
    const hash = hashPassword(password, salt);

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        await client.query("DELETE FROM Admin WHERE userID IN (SELECT userID FROM Users WHERE username = $1)", [username]);
        await client.query("DELETE FROM Users WHERE username = $1", [username]);

        const userRes = await client.query(
            `INSERT INTO Users (username, email, contactNumber, passwordHash, passwordSalt)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING userID`,
            [username, email, contact, hash, salt]
        );

        const userID = userRes.rows[0].userid;

        await client.query(
            `INSERT INTO Admin (userID, roleTitle)
             VALUES ($1,'System Admin')`,
            [userID]
        );

        await client.query("COMMIT");

        console.log("✅ ADMIN CREATED");
        console.log("username: admin_gen");
        console.log("password: Admin123");
        console.log("role: Admin");

    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
    } finally {
        client.release();
    }
}

run();