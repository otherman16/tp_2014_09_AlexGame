package backend;

import base.AccountServiceResponse;
import base.DBService;
import base.UserProfile;
import base.AccountService;

import javax.servlet.http.HttpSession;

public class AccountServiceImpl implements AccountService {
    private DBService dbService;

    public AccountServiceImpl() {
        dbService = new DBServiceImpl("jdbc:mysql://localhost/g06_alexgame_db","alexgame_user","alexgame_user");
        UserProfile admin = new UserProfile(1L, "admin", "admin@admin.ru", "admin", 1000L);
        try {
            if (!dbService.hasUserByEmail(admin.getEmail())) {
                dbService.addUser(admin);
            }
        } catch (Exception e) {
            System.out.println("Exception in AccountService.AccountServiceImpl: " + e.getMessage());
        }
    }

    public AccountServiceResponse authUser(UserProfile user, HttpSession session) {
        try{
            if (dbService.hasUserBySessionId(session.getId())) {
                return new AccountServiceResponse<>(false, "User is already authenticated");
            }
            if(!dbService.hasUserByEmail(user.getEmail())) {
                return new AccountServiceResponse<>(false,"Wrong email");
            }
            UserProfile _user = dbService.getUserByEmail(user.getEmail());
            if (!user.getPassword().equals(_user.getPassword())) {
                return new AccountServiceResponse<>(false,"Wrong password");
            }
            dbService.addSession(session.getId(),_user.getId());
            return new AccountServiceResponse<>(true,_user);
        } catch (Exception e) {
            System.out.println("Exception in AccountService.authUser: " + e.getMessage());
            return new AccountServiceResponse<>(false,"Internal server error");
        }
    }

    public AccountServiceResponse getUserBySession(HttpSession session) {
        try {
            if (!dbService.hasUserBySessionId(session.getId())) {
                return new AccountServiceResponse<>(false, "You are not authenticated");
            }
            return new AccountServiceResponse<>(true, dbService.getUserBySessionId(session.getId()));
        } catch (Exception e) {
            System.out.println("Exception in AccountService.getUserBySession: " + e.getMessage());
            return new AccountServiceResponse<>(false,"Internal server error");
        }
    }

    public AccountServiceResponse registerUser(UserProfile user, HttpSession session) {
        try {
            if (dbService.hasUserByEmail(user.getEmail())) {
                return new AccountServiceResponse<>(false, "User with those email already exists");
            }
            dbService.addUser(user);
            return this.authUser(user, session);
        } catch (Exception e) {
            System.out.println("Exception in AccountService.registerUser: " + e.getMessage());
            return new AccountServiceResponse<>(false,"Internal server error");
        }
    }

    public AccountServiceResponse logoutUser(HttpSession session) {
        try {
            if (!dbService.hasUserBySessionId(session.getId())) {
                return new AccountServiceResponse<>(false, "You are not authenticated");
            }
            dbService.removeSessionFromSessionList(session.getId());
            return new AccountServiceResponse<>(true,"Success");
        } catch (Exception e) {
            System.out.println("Exception in AccountService.logoutUser: " + e.getMessage());
            return new AccountServiceResponse<>(false,"Internal server error");
        }
    }

    public AccountServiceResponse numberOfRegisteredUsers() {
        try {
            return new AccountServiceResponse<>(true,dbService.getCountUser());
        } catch (Exception e) {
            System.out.println("Exception in AccountService.numberOfRegisteredUsers: " + e.getMessage());
            return new AccountServiceResponse<>(false,"Internal server error");
        }
    }

    public AccountServiceResponse numberOfAuthUsers() {
        try {
            return new AccountServiceResponse<>(true,dbService.getCountSessionList());
        } catch (Exception e) {
            System.out.println("Exception in AccountService.numberOfAuthUsers: " + e.getMessage());
            return new AccountServiceResponse<>(false,"Internal server error");
        }
    }

    public AccountServiceResponse getTop10() {
        try {
            return new AccountServiceResponse<>(true,dbService.getTop10());
        } catch (Exception e) {
            System.out.println("Exception in AccountService.getTop10: " + e.getMessage());
            return new AccountServiceResponse<>(false,"Internal server error");
        }
    }

    public AccountServiceResponse deleteUser(String email) {
        try {
            if(!dbService.hasUserByEmail(email)) {
                return new AccountServiceResponse<>(false,"User with those email does not exists");
            }
            dbService.deleteUserFromUser(email);
            return new AccountServiceResponse<>(true,"Success");
        } catch (Exception e) {
            System.out.println("Exception in AccountService.deleteUser: " + e.getMessage());
            return new AccountServiceResponse<>(false,"Internal server error");
        }
    }
}
