#ifndef RESTAURANTMANAGER_H
#define RESTAURANTMANAGER_H

#include "User.h"
#include "MenuItem.h"
#include "Order.h"
#include <vector>
#include <string>

class RestaurantManager : public User
{
public:
    RestaurantManager(int userID, const std::string &username, const std::string &email, const std::string &contactNumber, int restaurantID, const std::string &restaurantName,const std::string &openingHours);

    std::string getRole() const override;

    void setRestaurantName(const std::string &name);
    void setOpeningHours(const std::string &hours);
    std::string getRestaurantName() const;
    std::string getOpeningHours() const;
    int getRestaurantID() const;

    void addMenuItem(MenuItem *item);
    void removeMenuItem(int itemID);
    MenuItem *findMenuItem(int itemID) const;

    const std::vector<MenuItem *> &getMenu() const;
    const std::vector<Order *> &getOrderQueue() const;

    void addToOrderQueue(Order *order);
    void updateOrderStatus(int orderID, const std::string &newStatus);

private:
    int restaurantID;
    std::string restaurantName;
    std::string openingHours;
    std::vector<MenuItem *> menu;
    std::vector<Order *> orderQueue;
};

#endif
