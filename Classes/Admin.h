#ifndef ADMIN_H
#define ADMIN_H

#include "User.h"
#include "Order.h"
#include <vector>
#include <string>

class Admin : public User {
public:
    Admin(int userID, const std::string& username, const std::string& email, const std::string& contactNumber, const std::string& roleTitle);

    std::string getRole() const override;
    std::string getRoleTitle() const;
    void removeUser(int targetUserID, std::vector<User*>& users);
    std::string generateOrderReport(const std::vector<Order*>& allOrders) const;

private:
    std::string roleTitle;
};

#endif
