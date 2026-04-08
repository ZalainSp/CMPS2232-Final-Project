#ifndef DRINKITEM_H
#define DRINKITEM_H

#include "MenuItem.h"
#include <string>

class DrinkItem : public MenuItem {
public:
    DrinkItem(int id, const std::string& name, double basePrice, bool available, const std::string& cupSize);

    double getPrice() const override;
    std::string getDescription() const override;

    void setCupSize(const std::string& size);
    std::string getCupSize() const;

private:
    std::string cupSize;
};

#endif
