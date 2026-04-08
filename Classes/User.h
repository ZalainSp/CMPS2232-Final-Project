#ifndef USER_H
#define USER_H

#include <string>

class User
{
public:
    User(int userID, const std::string &username, const std::string &email, const std::string &contactNumber);
    virtual ~User();

    virtual std::string getRole() const = 0;

    int getUserID() const;
    std::string getUsername() const;
    std::string getEmail() const;
    std::string getContactNumber() const;
    std::string getDetails() const;

    void setEmail(const std::string &email);
    void setContactNumber(const std::string &number);

protected:
    int userID;
    std::string username;
    std::string email;
    std::string contactNumber;
};

#endif
