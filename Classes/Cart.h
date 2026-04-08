#ifndef CART_H
#define CART_H

#include "MenuItem.h"
#include <vector>

class Cart {
public:
    Cart();

    void addItem(MenuItem* item);
    void removeItem(int itemID);
    void clear();

    double calculateSubtotal() const;
    bool isEmpty() const;

    const std::vector<MenuItem*>& getItems() const;

private:
    std::vector<MenuItem*> items;
};

#endif
