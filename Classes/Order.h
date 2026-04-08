#ifndef ORDER_H
#define ORDER_H

#include "MenuItem.h"
#include <vector>
#include <string>

class Customer;
class Driver;

class Order
{
public:
    Order(int orderID, Customer *customer, const std::vector<MenuItem *> &cartItems, const std::string &deliveryType);

    double calculateSubtotal() const;
    double calculateTax() const;
    double calculateDeliveryFee() const;
    double calculateTotal() const;

    std::string getStatus() const;
    void setStatus(const std::string &status);

    void assignDriver(Driver *driver);
    Driver *getAssignedDriver() const;

    std::string generateReceipt() const;

    int getOrderID() const;
    std::string getOrderDate() const;
    std::string getDeliveryType() const;
    Customer *getCustomer() const;

    const std::vector<MenuItem *> &getItems() const;

private:
    int orderID;
    std::string orderDate;
    Customer *customer;
    std::vector<MenuItem *> items;
    std::string deliveryType;
    std::string status;
    Driver *assignedDriver;

    static const double TAX_RATE;
    static const double STANDARD_FEE;
    static const double PRIORITY_FEE;
};

#endif
