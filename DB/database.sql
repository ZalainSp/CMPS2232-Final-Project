/* GO BITES     
- User Management

The system uses a central User table with role-based extensions:

User (base table)
Admin (system management)
Customer (orders and cart)
Driver (delivery handling)
RestaurantManager (menu and order control)

Each role table references userID from User.

- Menu System

The menu is built using polymorphism:

MenuItem (base item)
FoodItem (portion size)
DrinkItem (cup size)
ComboMeal (discounted items)

All specialized items reference itemID from MenuItem.

- Cart System

Cart is linked to Customer via userID
CartItem connects Cart and MenuItem (many-to-many relationship)

This allows customers to store multiple items before checkout.

- Order System

Order stores customer and driver references
OrderItem connects Order and MenuItem

This supports multiple items per order and proper delivery tracking.

- Promo System

PromoCode stores discount logic
Applied during checkout to reduce order totals

= Key Design Principle
Clean inheritance (User roles)
Polymorphism (MenuItem types)
Many-to-many relationships (CartItem, OrderItem)

*/

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

/*RestaurantManager*/
CREATE TABLE RestaurantManager (
    userID INT PRIMARY KEY,
    restaurantID INT,
    restaurantName VARCHAR(100),
    openingHours VARCHAR(100),
    FOREIGN KEY (userID) REFERENCES User(userID)
);

/*MenuItem*/
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

/*ComboMeal*/
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


/*PromoCode*/
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

/* Note: Updates to make for auth */

/*Password Management (hashing and salting BCRYPT)*/
ALTER TABLE User
ADD COLUMN passwordHash VARCHAR(128) NOT NULL DEFAULT '',
ADD COLUMN passwordSalt VARCHAR(64)  NOT NULL DEFAULT '';


/*Session Management*/ 
CREATE TABLE Session (
    token     VARCHAR(64) PRIMARY KEY,
    userID    INT,
    role      VARCHAR(50),
    expiresAt DATETIME,
    FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE
);


