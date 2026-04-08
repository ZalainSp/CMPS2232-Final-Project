#ifndef MENUITEM_H
#define MENUITEM_H

#include <string>

class MenuItem
{
public:
    MenuItem(int id, const std::string &name, double basePrice, bool available);
    virtual ~MenuItem();

    virtual double getPrice() const = 0;
    virtual std::string getDescription() const;

    int getItemID() const;
    std::string getItemName() const;
    bool isAvailable() const;

    void setBasePrice(double price);
    void toggleAvailability();

protected:
    int itemID;
    std::string itemName;
    double basePrice;
    bool isAvailable;
};

#endif
