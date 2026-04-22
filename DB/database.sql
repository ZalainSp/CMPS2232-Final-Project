/* GO BITES     
- Users Management

The system uses a central Users table with role-based extensions:

Users (base table)
Admin (system management)
Customer (orders and cart)
Driver (delivery handling)
RestaurantManager (menu and orders control)

Each role table references userID from Users.

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

- Orders System

Orders stores customer and driver references
OrderItem connects Orders and MenuItem

This supports multiple items per orders and proper delivery tracking.

- Promo System

PromoCode stores discount logic
Applied during checkout to reduce orders totals

= Key Design Principle
Clean inheritance (Users roles)
Polymorphism (MenuItem types)
Many-to-many relationships (CartItem, OrderItem)

*/

/* Users */
CREATE TABLE Users (
    userID SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    contactNumber VARCHAR(20)
);

/*Admin*/
CREATE TABLE Admin (
    userID INT PRIMARY KEY,
    roleTitle VARCHAR(100),
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);

/*Customer*/
CREATE TABLE Customer (
    userID INT PRIMARY KEY,
    deliveryAddress VARCHAR(255),
    userStatus VARCHAR(50),
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);

/*Driver*/
CREATE TABLE Driver (
    userID INT PRIMARY KEY,
    driverID INT,
    vehicleType VARCHAR(50),
    available BOOLEAN,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);

/*RestaurantManager*/
CREATE TABLE RestaurantManager (
    userID INT PRIMARY KEY,
    restaurantID INT,
    restaurantName VARCHAR(100),
    openingHours VARCHAR(100),
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);

/*MenuItem*/
CREATE TABLE MenuItem (
    itemID SERIAL PRIMARY KEY,
    itemName VARCHAR(100) NOT NULL,
    basePrice DECIMAL(10,2) NOT NULL,
    isAvailable BOOLEAN DEFAULT TRUE
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
    discountAmount DECIMAL (10,2),
    FOREIGN KEY (itemID) REFERENCES MenuItem(itemID)
);

/*Orders*/
CREATE TABLE Orders (
    orderID SERIAL PRIMARY KEY,
    orderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deliveryType VARCHAR(50),
    status VARCHAR(50),
    customerID INT,
    driverID INT,
    FOREIGN KEY (customerID) REFERENCES Customer(userID) ON DELETE CASCADE,
    FOREIGN KEY (driverID) REFERENCES Driver(userID) ON DELETE CASCADE
);


/*PromoCode*/
CREATE TABLE PromoCode (
    code VARCHAR(50) PRIMARY KEY,
    discountPercent DECIMAL (5,2),
    active BOOLEAN
);

/* OrderItem */
CREATE TABLE OrderItem (
    orderID INT,
    itemID INT,
    quantity INT DEFAULT 1,
    PRIMARY KEY (orderID, itemID),
    FOREIGN KEY (orderID) REFERENCES Orders(orderID) ON DELETE CASCADE,
    FOREIGN KEY (itemID) REFERENCES MenuItem(itemID) ON DELETE CASCADE
);

/*Cart*/
CREATE TABLE Cart (
    userID INT PRIMARY KEY,
    FOREIGN KEY (userID) REFERENCES Customer(userID) ON DELETE CASCADE
);

/*CartItem*/
CREATE TABLE CartItem (
    userID INT,
    itemID INT,
    quantity INT DEFAULT 1,
    PRIMARY KEY (userID, itemID),
    FOREIGN KEY (userID) REFERENCES Cart(userID),
    FOREIGN KEY (itemID) REFERENCES MenuItem(itemID)
);

/* Note: Updates to make for auth */

/*Password Management (hashing and salting BCRYPT)*/
ALTER TABLE Users
ADD COLUMN passwordHash VARCHAR(128) NOT NULL DEFAULT '',
ADD COLUMN passwordSalt VARCHAR(64)  NOT NULL DEFAULT '';


/*Session Management*/ 
CREATE TABLE Session (
    token     VARCHAR(64) PRIMARY KEY,
    userID    INT,
    role      VARCHAR(50),
    expiresAt TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);