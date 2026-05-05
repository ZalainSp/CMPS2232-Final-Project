/* User */
CREATE TABLE User (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(100),
    contactNumber VARCHAR(20)
);

/*Admin*/
CREATE TABLE Admin (
    userID INT PRIMARY KEY,
    roleTitle VARCHAR(100),
    FOREIGN KEY (userID) REFERENCES User(userID)
);

/*Customer*/
CREATE TABLE Customer (
    userID INT PRIMARY KEY,
    deliveryAddress VARCHAR(255),
    userStatus VARCHAR(50),
    FOREIGN KEY (userID) REFERENCES User(userID)
);

/*Driver*/
CREATE TABLE Driver (
    userID INT PRIMARY KEY,
    driverID INT,
    vehicleType VARCHAR(50),
    available BOOLEAN,
    FOREIGN KEY (userID) REFERENCES User(userID)
);

/*Restaurant Manager*/
CREATE TABLE RestaurantManager (
    userID INT PRIMARY KEY,
    restaurantID INT,
    restaurantName VARCHAR(100),
    openingHours VARCHAR(100),
    FOREIGN KEY (userID) REFERENCES User(userID)
);

/*Menu Item*/
CREATE TABLE MenuItem (
    itemID INT AUTO_INCREMENT PRIMARY KEY,
    itemName VARCHAR(100),
    basePrice DOUBLE,
    isAvailable BOOLEAN
);

/*FoodItem*/
CREATE TABLE FoodItem (
    itemID INT PRIMARY KEY,
    portionSize VARCHAR(50),
    FOREIGN KEY (itemID) REFERENCES MenuItem(itemID)
);

/*DrinkItem*/
CREATE TABLE DrinkItem (
    itemID INT PRIMARY KEY,
    cupSize VARCHAR(50),
    FOREIGN KEY (itemID) REFERENCES MenuItem(itemID)
);

/*Combo Meal*/
CREATE TABLE ComboMeal (
    itemID INT PRIMARY KEY,
    discountAmount DOUBLE,
    FOREIGN KEY (itemID) REFERENCES MenuItem(itemID)
);

/*Order*/
CREATE TABLE `Order` (
    orderID INT AUTO_INCREMENT PRIMARY KEY,
    orderDate VARCHAR(50),
    deliveryType VARCHAR(50),
    status VARCHAR(50),
    userID INT,
    driverID INT,
    FOREIGN KEY (userID) REFERENCES Customer(userID),
    FOREIGN KEY (driverID) REFERENCES Driver(userID)
);


/*Promo Code*/
CREATE TABLE PromoCode (
    code VARCHAR(50) PRIMARY KEY,
    discountPercent DOUBLE,
    active BOOLEAN
);

/* OrderItem */
CREATE TABLE OrderItem (
    orderID INT,
    itemID INT,
    PRIMARY KEY (orderID, itemID),
    FOREIGN KEY (orderID) REFERENCES `Order`(orderID),
    FOREIGN KEY (itemID) REFERENCES MenuItem(itemID)
);

/*Cart*/
CREATE TABLE Cart (
    userID INT PRIMARY KEY,
    FOREIGN KEY (userID) REFERENCES Customer(userID)
);

/*CartItem*/
CREATE TABLE CartItem (
    userID INT,
    itemID INT,
    PRIMARY KEY (userID, itemID),
    FOREIGN KEY (userID) REFERENCES Cart(userID),
    FOREIGN KEY (itemID) REFERENCES MenuItem(itemID)
);

/*Select for testing*/
Select * From Users;
Select * From Customer;
Select * From Cart;
Select * From MenuItem;
Select * From DrinkItem;
Select * From CartItem;
Select * From FoodItem;
Select * From Orders;
Select * From RestaurantManager;

-- Truncate WIPE DB & test 
TRUNCATE 
    Session, CartItem, Cart, OrderItem, Orders, 
    FoodItem, DrinkItem, ComboMeal, MenuItem, 
    Admin, Customer, Driver, RestaurantManager, 
    Users, PromoCode
RESTART IDENTITY CASCADE;

-- Profile creation timestamp
ALTER TABLE Users ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Fixed Payment method table
-- Add paymentMethod with a default of 'Cash'
ALTER TABLE Orders ADD COLUMN paymentMethod VARCHAR(20) DEFAULT 'Cash';

-- Add a constraint to ensure only valid payment types are entered
-- (This prevents typos like 'Csh' from entering your DB)
ALTER TABLE Orders ADD CONSTRAINT chk_payment_type 
CHECK (paymentMethod IN ('Cash', 'Digital Wallet', 'Credit/Debit'));

	--- Fix #3 for RestaurantManager and related tables ---
	-- 1. Remove the old "human" columns to stop the mess
ALTER TABLE MenuItem DROP COLUMN IF EXISTS managerID;
ALTER TABLE Orders DROP COLUMN IF EXISTS managerID;

-- 2. Ensure restaurantID is unique in the manager table (Required for Foreign Keys)
ALTER TABLE RestaurantManager ADD CONSTRAINT unique_restaurant_id UNIQUE (restaurantID);

-- 3. Add the Business Link to Menu and Orders
ALTER TABLE MenuItem ADD COLUMN IF NOT EXISTS restaurantID INT;
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS restaurantID INT;

-- 4. Apply the Business-Level safety rules
ALTER TABLE MenuItem ADD CONSTRAINT fk_menu_restaurant 
    FOREIGN KEY (restaurantID) REFERENCES RestaurantManager(restaurantID) ON DELETE CASCADE;

ALTER TABLE Orders ADD CONSTRAINT fk_orders_restaurant 
    FOREIGN KEY (restaurantID) REFERENCES RestaurantManager(restaurantID) ON DELETE CASCADE;