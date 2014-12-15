package backend;

import base.*;
import database.DBServiceImpl;
import main.ThreadSettings;
import messageSystem.Abonent;
import messageSystem.Address;
import messageSystem.MessageSystem;
import resourse.Admin;
import resourse.DataBase;
import resourse.ResourceFactory;

import javax.servlet.http.HttpSession;

public class AccountServiceImpl implements AccountService, Abonent {

    private final Address address = new Address();
    private final MessageSystem messageSystem;

    private DBService dbService;

    public Address getAddress() {
        return address;
    }

    public MessageSystem getMessageSystem() {
        return messageSystem;
    }

    public AccountServiceImpl(MessageSystem ms) {
        this.messageSystem = ms;
        messageSystem.addService(this);
        messageSystem.getAddressService().registerAccountService(this);
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

    @Override
    public AccountServiceResponse authUser(UserProfile user, HttpSession session) {
        try{
            if (dbService.isSessionExistsBySessionId(session.getId())) {
                return new AccountServiceResponse<>(false, AccountServiceError.IsAuthError);
            }
            if(!dbService.isUserExistsByEmail(user.getEmail())) {
                return new AccountServiceResponse<>(false, AccountServiceError.WrongEmailError);
            }
            UserProfile _user = dbService.getUserByEmail(user.getEmail());
            if (!user.getPassword().equals(_user.getPassword())) {
                return new AccountServiceResponse<>(false, AccountServiceError.WrongPasswordError);
            }
            dbService.addSession(session.getId(),_user.getId());
            return new AccountServiceResponse<>(true,_user);
        } catch (Exception e) {
            System.out.println("Exception in AccountService.authUser: " + e.getMessage());
            return new AccountServiceResponse<>(false, AccountServiceError.ServerError);
        }
    }

    @Override
    public AccountServiceResponse getUserBySession(HttpSession session) {
        try {
            if (!dbService.isSessionExistsBySessionId(session.getId())) {
                return new AccountServiceResponse<>(false, AccountServiceError.NotAuthError);
            }
            return new AccountServiceResponse<>(true, dbService.getUserBySessionId(session.getId()));
        } catch (Exception e) {
            System.out.println("Exception in AccountService.getUserBySession: " + e.getMessage());
            return new AccountServiceResponse<>(false, AccountServiceError.ServerError);
        }
    }

    @Override
    public AccountServiceResponse registerUser(UserProfile user, HttpSession session) {
        try {
            if (dbService.isUserExistsByEmail(user.getEmail())) {
                return new AccountServiceResponse<>(false, AccountServiceError.UserExistsError);
            }
            dbService.addUser(user);
            return this.authUser(user, session);
        } catch (Exception e) {
            System.out.println("Exception in AccountService.registerUser: " + e.getMessage());
            return new AccountServiceResponse<>(false, AccountServiceError.ServerError);
        }
    }

    @Override
    public AccountServiceResponse logoutUser(HttpSession session) {
        try {
            if (!dbService.isSessionExistsBySessionId(session.getId())) {
                return new AccountServiceResponse<>(false, AccountServiceError.NotAuthError);
            }
            dbService.deleteSession(session.getId());
            return new AccountServiceResponse<>(true,"Success");
        } catch (Exception e) {
            System.out.println("Exception in AccountService.logoutUser: " + e.getMessage());
            return new AccountServiceResponse<>(false, AccountServiceError.ServerError);
        }
    }

    @Override
    public AccountServiceResponse numberOfRegisteredUsers() {
        try {
            return new AccountServiceResponse<>(true,dbService.getCountUser());
        } catch (Exception e) {
            System.out.println("Exception in AccountService.numberOfRegisteredUsers: " + e.getMessage());
            return new AccountServiceResponse<>(false, AccountServiceError.ServerError);
        }
    }

    @Override
    public AccountServiceResponse numberOfAuthUsers() {
        try {
            return new AccountServiceResponse<>(true,dbService.getCountSessionList());
        } catch (Exception e) {
            System.out.println("Exception in AccountService.numberOfAuthUsers: " + e.getMessage());
            return new AccountServiceResponse<>(false, AccountServiceError.ServerError);
        }
    }

    @Override
    public AccountServiceResponse getTop10() {
        try {
            return new AccountServiceResponse<>(true,dbService.getTop10());
        } catch (Exception e) {
            System.out.println("Exception in AccountService.getTop10: " + e.getMessage());
            return new AccountServiceResponse<>(false, AccountServiceError.ServerError);
        }
    }

    @Override
    public AccountServiceResponse deleteUser(String email) {
        try {
            if(!dbService.isUserExistsByEmail(email)) {
                return new AccountServiceResponse<>(false, AccountServiceError.WrongEmailError);
            }
            dbService.deleteUser(email);
            return new AccountServiceResponse<>(true,"Success");
        } catch (Exception e) {
            System.out.println("Exception in AccountService.deleteUser: " + e.getMessage());
            return new AccountServiceResponse<>(false, AccountServiceError.ServerError);
        }
    }

    @Override
    public AccountServiceResponse increaseScore(String findEmail, int scoreToIncrease) {
        try{
            dbService.increaseScore(findEmail, scoreToIncrease);
            return new AccountServiceResponse<>(true, findEmail);
        } catch (Exception e) {
            System.out.println("Exception in AccountService.increaseScore: " + e.getMessage());
            return new AccountServiceResponse<>(false, AccountServiceError.ServerError);
        }
    }

    public void run() {
        while (true){
            messageSystem.execForAbonent(this);
            try {
                Thread.sleep(ThreadSettings.SERVICE_SLEEP_TIME);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
