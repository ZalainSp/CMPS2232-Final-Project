#ifndef FOODITEM_H
#define FOODITEM_H

#include "MenuItem.h"
#include <string>

class FoodItem : public MenuItem
{
public:
    FoodItem(int id, const std::string &name, double basePrice, bool available, const std::string &portionSize);

    double getPrice() const override;
    std::string getDescription() const override;

    void setPortionSize(const std::string &size);
    std::string getPortionSize() const;

private:
    std::string portionSize;
};

#endif
