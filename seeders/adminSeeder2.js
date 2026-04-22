const db = require("../dist/DB/dbConnection");
const crypto = require("crypto");

function hashPassword(password, salt) {
    return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

async function run() {
    const username = "admin_melva";
    const email = "admin2@gobites.bz";
    const contact = "+5016000032";

    const password = "Admin1234";
    const salt = "fixed_salt_admin_2";
    const hash = hashPassword(password, salt);

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // cleanup if exists
        await client.query(
            "DELETE FROM Admin WHERE userID IN (SELECT userID FROM Users WHERE username = $1)",
            [username]
        );

        await client.query(
            "DELETE FROM Users WHERE username = $1",
            [username]
        );

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

        console.log("✅ SECOND ADMIN CREATED");
        console.log("username: admin_melva");
        console.log("password: Admin1234");

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Seeder error:", err);
    } finally {
        client.release();
    }
}

run();