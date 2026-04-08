#ifndef PROMOCODE_H
#define PROMOCODE_H

#include <string>

class PromoCode
{
public:
    PromoCode(const std::string &code, double discountPercent, bool active);

    std::string getCode() const;
    double getDiscountPercent() const;
    bool isActive() const;
    void deactivate();

private:
    std::string code;
    double discountPercent;
    bool active;
};

#endif
