#ifndef CUSTOMER_H
#define CUSTOMER_H

#include "User.h"
#include "Cart.h"
#include "Order.h"
#include "PromoCode.h"
#include <vector>
#include <string>

class Customer : public User {
public:
    Customer(int userID, const std::string& username, const std::string& email, const std::string& contactNumber, const std::string& deliveryAddress, const std::string& userStatus);

    std::string getRole() const override;

    Cart& getCart();
    void clearCart();

    void placeOrder(Order* order);
    void trackOrderStatus(int orderID) const;

    double applyPromoCode(const std::string& code, double subtotal, const std::vector<PromoCode>& available) const;

    const std::vector<Order*>& getOrderHistory() const;
    std::string getDeliveryAddress() const;
    std::string getUserStatus() const;
    void setDeliveryAddress(const std::string& address);

private:
    std::string deliveryAddress;
    std::string userStatus;
    Cart cart;
    std::vector<Order*> orderHistory;
};

#endif
