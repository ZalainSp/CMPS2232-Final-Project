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

-- Ensure Restaurant IDs use a sequence and populate NULLs (safe, idempotent)
-- Remove any old defaults or constraints that conflict with the new identity migration
ALTER TABLE RestaurantManager ALTER COLUMN restaurantID DROP DEFAULT;
ALTER TABLE MenuItem DROP CONSTRAINT IF EXISTS fk_menu_owner;
ALTER TABLE Orders DROP CONSTRAINT IF EXISTS fk_orders_owner;

-- Prepare existing rows and make restaurantID non-null
UPDATE RestaurantManager SET restaurantID = 99 WHERE restaurantID IS NULL;
ALTER TABLE RestaurantManager ALTER COLUMN restaurantID SET NOT NULL;

-- Convert restaurantID to an IDENTITY column starting at 100 and ensure DB ALWAYS generates it
DO $$
BEGIN
	-- Drop any existing identity (safe if none exists)
	BEGIN
		ALTER TABLE RestaurantManager ALTER COLUMN restaurantID DROP IDENTITY IF EXISTS;
	EXCEPTION WHEN OTHERS THEN
		RAISE NOTICE 'DROP IDENTITY skipped or unsupported: %', SQLERRM;
	END;

	-- Add ALWAYS identity so DB ignores explicit NULLs sent by code
	BEGIN
		ALTER TABLE RestaurantManager 
			ALTER COLUMN restaurantID ADD GENERATED ALWAYS AS IDENTITY (START WITH 100);
	EXCEPTION WHEN OTHERS THEN
		RAISE NOTICE 'Adding GENERATED ALWAYS skipped or already applied: %', SQLERRM;
	END;
END$$;

-- Ensure restaurantID exists on dependent tables and attach FK constraints
ALTER TABLE MenuItem ADD COLUMN IF NOT EXISTS restaurantID INT;
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS restaurantID INT;

ALTER TABLE MenuItem DROP CONSTRAINT IF EXISTS fk_menu_res;
ALTER TABLE Orders DROP CONSTRAINT IF EXISTS fk_order_res;

ALTER TABLE MenuItem ADD CONSTRAINT IF NOT EXISTS fk_menu_restaurant 
	FOREIGN KEY (restaurantID) REFERENCES RestaurantManager(restaurantID) ON DELETE CASCADE;

ALTER TABLE Orders ADD CONSTRAINT IF NOT EXISTS fk_orders_restaurant 
	FOREIGN KEY (restaurantID) REFERENCES RestaurantManager(restaurantID) ON DELETE CASCADE;

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

