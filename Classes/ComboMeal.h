#ifndef COMBOMEAL_H
#define COMBOMEAL_H

#include "MenuItem.h"
#include <vector>
#include <string>

class ComboMeal : public MenuItem {
public:
    ComboMeal(int id, const std::string& name, double discountAmount, bool available);

    double getPrice() const override;
    std::string getDescription() const override;

    void addItem(MenuItem* item);
    void removeItem(int itemID);
    double calculateSavings() const;

    const std::vector<MenuItem*>& getincludedItems() const;

private:
    std::vector<MenuItem*> includedItems;
    double discountAmount;
};

#endif
