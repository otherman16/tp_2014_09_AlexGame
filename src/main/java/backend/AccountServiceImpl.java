package backend;

import base.DBService;
import base.UserProfile;
import base.AccountService;

import javax.servlet.http.HttpSession;
import java.util.ArrayList;

public class AccountServiceImpl implements AccountService {
    private static DBService dbService;

    public AccountServiceImpl() {
        dbService = new DBServiceImpl("jdbc:mysql://localhost/g06_alexgame_db","alexgame_user","alexgame_user");
        this.addUser(new UserProfile(1L, "admin", "admin@admin.ru", "admin", 1000L));
    }

    private boolean addUser(UserProfile user) {
        return !dbService.hasUserByEmail(user.getEmail()) && dbService.addUser(user);
    }

    private boolean isCorUserData(UserProfile user) {
        if (dbService.hasUserByEmail(user.getEmail())) {
            UserProfile _user = dbService.getUserByEmail(user.getEmail());
            return user.getPassword().equals(_user.getPassword());
        }
        else {
            return false;
        }
    }

    private boolean rememberUser(UserProfile user, HttpSession session) {
        if( !dbService.hasUserBySessionHashCode(session.getId()) ) {
            UserProfile _user = dbService.getUserByEmail(user.getEmail());
            session.setAttribute("userId", _user.getId());
            return dbService.addSession(session.getId(), _user.getId());
        }
        else {
            return false;
        }
    }

    public boolean authUser(UserProfile user, HttpSession session) {
        return this.isCorUserData(user) && this.rememberUser(user, session);
    }

    public UserProfile getUserBySession(HttpSession session) {
        if ( dbService.hasUserBySessionHashCode(session.getId()) ) {
            return dbService.getUserBySessionHashCode(session.getId());
        }
        else {
            return null;
        }
    }

    public boolean registerUser(UserProfile user, HttpSession session) {
        return this.addUser(user) && this.rememberUser(user, session);
    }

    public boolean logoutUser(HttpSession session) {
        if (dbService.hasUserBySessionHashCode(session.getId()) && dbService.removeSessionFromSessionList(session.getId())) {
            session.invalidate();
            return true;
        }
        else {
            return false;
        }
    }

    public Integer numberOfRegisteredUsers() {
        return dbService.getCountUser();
    }

    public Integer numberOfAuthUsers() {
        return dbService.getCountSessionList();
    }

    public ArrayList<UserProfile> getTop10() {
        return dbService.getTop10();
    }

    public boolean deleteUser(String email) {
        return dbService.deleteUserFromUser(email);
    }
}
