#ifndef DRIVER_H
#define DRIVER_H

#include "User.h"
#include "Order.h"
#include <string>

class Driver : public User
{
public:
    Driver(int userID, const std::string &username, const std::string &email, const std::string &contactNumber, int driverID, const std::string &vehicleType);

    std::string getRole() const override;

    int getDriverID() const;
    std::string getVehicleType() const;
    bool isAvailable() const;
    void setAvailability(bool available);

    void acceptDelivery(Order *order);
    void updateDeliveryStatus(Order *order, const std::string &status);

private:
    int driverID;
    std::string vehicleType;
    bool available;
};

#endif
