/*I seeded only core authentication-related tables first. The Users table handles login credentials, while role-based extension tables like Admin and Customer define access control. I also added a Session table to simulate token-based authentication and test login persistence before integrating backend logic.*/

INSERT INTO Users (username, email, contactNumber, passwordHash, passwordSalt)
VALUES 
('admin_gen', 'admin@gobites.bz', '+5016000001', 'hash_admin', 'salt1'),
('jane_customer', 'jane@gobites.bz', '+5016000002', 'hash_customer', 'salt2'),
('tony_driver', 'driver@gobites.bz', '+5016000003', 'hash_driver', 'salt3');

INSERT INTO Admin (userID, roleTitle)
VALUES (1, 'System Administrator');

INSERT INTO Customer (userID, deliveryAddress, userStatus)
VALUES (2, '12 Coconut Drive, San Ignacio', 'Active');

INSERT INTO Driver (userID, driverID, vehicleType, available)
VALUES (3, 501, 'Motorcycle', TRUE);

INSERT INTO Session (token, userID, role, expiresAt)
VALUES 
('token_admin_123', 1, 'Admin', NOW() + INTERVAL '1 day');

SELECT userID, username, passwordHash, passwordSalt
FROM Users
WHERE email = 'admin@gobites.bz';

SELECT u.userID, u.username, a.roleTitle
FROM Users u
JOIN Admin a ON u.userID = a.userID
WHERE u.userID = 1; 

SELECT u.username, c.deliveryAddress, c.userStatus
FROM Users u
JOIN Customer c ON u.userID = c.userID
WHERE u.userID = 2;

SELECT *
FROM Session
WHERE token = 'token_admin_123'
AND expiresAt > NOW();

