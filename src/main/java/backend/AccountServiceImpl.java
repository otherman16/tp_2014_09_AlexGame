package backend;

import base.*;
import database.DBServiceImpl;
import resourse.Admin;
import resourse.DataBase;
import resourse.ResourceFactory;

import javax.servlet.http.HttpSession;

public class AccountServiceImpl implements AccountService {

    private DBService dbService;

    public AccountServiceImpl() {
        try {
            DataBase dataBase = (DataBase)ResourceFactory.instance().get("./data/dataBase.xml");
            dbService = new DBServiceImpl(dataBase.getHost(), dataBase.getPort(), dataBase.getUser(), dataBase.getName(), dataBase.getPassword());
            Admin admin = (Admin)ResourceFactory.instance().get("./data/admin.xml");
            UserProfile user = new UserProfile(Long.parseLong(admin.getId()), admin.getName(), admin.getEmail(), admin.getPassword(), Long.parseLong(admin.getScore()));
            if (!dbService.isUserExistsByEmail(admin.getEmail())) {
                dbService.addUser(user);
            }
        } catch (Exception e) {
            System.out.println("Exception in AccountService.AccountServiceImpl: " + e.getMessage());
        }
    }

    public AccountServiceResponse authUser(UserProfile user, HttpSession session) {
        try{
            if (dbService.isSessionExistsBySessionId(session.getId())) {
                return new AccountServiceResponse<>(false, new AccountServiceError("IsAuthError"));
            }
            if(!dbService.isUserExistsByEmail(user.getEmail())) {
                return new AccountServiceResponse<>(false, new AccountServiceError("WrongEmailError"));
            }
            UserProfile _user = dbService.getUserByEmail(user.getEmail());
            if (!user.getPassword().equals(_user.getPassword())) {
                return new AccountServiceResponse<>(false, new AccountServiceError("WrongPasswordError"));
            }
            dbService.addSession(session.getId(),_user.getId());
            return new AccountServiceResponse<>(true,_user);
        } catch (Exception e) {
            System.out.println("Exception in AccountService.authUser: " + e.getMessage());
            return new AccountServiceResponse<>(false, new AccountServiceError("ServerError"));
        }
    }

    public AccountServiceResponse getUserBySession(HttpSession session) {
        try {
            if (!dbService.isSessionExistsBySessionId(session.getId())) {
                return new AccountServiceResponse<>(false, new AccountServiceError("NotAuthError"));
            }
            return new AccountServiceResponse<>(true, dbService.getUserBySessionId(session.getId()));
        } catch (Exception e) {
            System.out.println("Exception in AccountService.getUserBySession: " + e.getMessage());
            return new AccountServiceResponse<>(false, new AccountServiceError("ServerError"));
        }
    }

    public AccountServiceResponse registerUser(UserProfile user, HttpSession session) {
        try {
            if (dbService.isUserExistsByEmail(user.getEmail())) {
                return new AccountServiceResponse<>(false, new AccountServiceError("UserExistsError"));
            }
            dbService.addUser(user);
            return this.authUser(user, session);
        } catch (Exception e) {
            System.out.println("Exception in AccountService.registerUser: " + e.getMessage());
            return new AccountServiceResponse<>(false, new AccountServiceError("ServerError"));
        }
    }

    public AccountServiceResponse logoutUser(HttpSession session) {
        try {
            if (!dbService.isSessionExistsBySessionId(session.getId())) {
                return new AccountServiceResponse<>(false, new AccountServiceError("NotAuthError"));
            }
            dbService.deleteSession(session.getId());
            return new AccountServiceResponse<>(true,"Success");
        } catch (Exception e) {
            System.out.println("Exception in AccountService.logoutUser: " + e.getMessage());
            return new AccountServiceResponse<>(false, new AccountServiceError("ServerError"));
        }
    }

    public AccountServiceResponse numberOfRegisteredUsers() {
        try {
            return new AccountServiceResponse<>(true,dbService.getCountUser());
        } catch (Exception e) {
            System.out.println("Exception in AccountService.numberOfRegisteredUsers: " + e.getMessage());
            return new AccountServiceResponse<>(false, new AccountServiceError("ServerError"));
        }
    }

    public AccountServiceResponse numberOfAuthUsers() {
        try {
            return new AccountServiceResponse<>(true,dbService.getCountSessionList());
        } catch (Exception e) {
            System.out.println("Exception in AccountService.numberOfAuthUsers: " + e.getMessage());
            return new AccountServiceResponse<>(false, new AccountServiceError("ServerError"));
        }
    }

    public AccountServiceResponse getTop10() {
        try {
            return new AccountServiceResponse<>(true,dbService.getTop10());
        } catch (Exception e) {
            System.out.println("Exception in AccountService.getTop10: " + e.getMessage());
            return new AccountServiceResponse<>(false, new AccountServiceError("ServerError"));
        }
    }

    public AccountServiceResponse deleteUser(String email) {
        try {
            if(!dbService.isUserExistsByEmail(email)) {
                return new AccountServiceResponse<>(false, new AccountServiceError("WrongEmailError"));
            }
            dbService.deleteUser(email);
            return new AccountServiceResponse<>(true,"Success");
        } catch (Exception e) {
            System.out.println("Exception in AccountService.deleteUser: " + e.getMessage());
            return new AccountServiceResponse<>(false, new AccountServiceError("ServerError"));
        }
    }
}
