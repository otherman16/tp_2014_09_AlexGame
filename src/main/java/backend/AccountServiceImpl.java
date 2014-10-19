package backend;

import base.DBService;
import base.UserProfile;
import base.AccountService;

import javax.servlet.http.HttpSession;
import java.util.ArrayList;

/**
 * Created by Алексей on 23.09.2014.
 */
public class AccountServiceImpl implements AccountService {
    private static DBService dbService;

    public AccountServiceImpl() {
        dbService = new DBServiceImpl("jdbc:mysql://localhost/g06_alexgame_db","alexgame_user","alexgame_user");
        this.addUser(new UserProfile(1L, "admin", "admin@admin.ru", "admin", 1000L));
    }

    // Добавление нового пользователя в базу
    private boolean addUser(UserProfile user) {
        return !dbService.hasUserByEmail(user.getEmail()) && dbService.addUser(user);
    }
    // Проверка корректности введенных пользователем данных
    private boolean isCorUserData(UserProfile user) {
        if (dbService.hasUserByEmail(user.getEmail())) {
            UserProfile _user = dbService.getUserByEmail(user.getEmail());
            return user.getPassword().equals(_user.getPassword());
        }
        else {
            return false;
        }
    }
    // Запомнить пользователя в Карту сессий
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
    // Авторизация пользователя
    public boolean authUser(UserProfile user, HttpSession session) {
        return this.isCorUserData(user) && this.rememberUser(user, session);
    }
    // Получить профиль пользователя по идентификатору сессии
    public UserProfile getUserBySession(HttpSession session) {
        if ( dbService.hasUserBySessionHashCode(session.getId()) ) {
            return dbService.getUserBySessionHashCode(session.getId());
        }
        else {
            return null;
        }
    }
    // Регистрация пользователя
    public boolean registerUser(UserProfile user, HttpSession session) {
        return this.addUser(user) && this.rememberUser(user, session);
    }
    // Logout пользователя
    public boolean logoutUser(HttpSession session) {
        if (dbService.hasUserBySessionHashCode(session.getId()) && dbService.removeSessionFromSessionList(session.getId())) {
            session.invalidate();
            return true;
        }
        else {
            return false;
        }
    }
    // Количество зарегестрированныйх пользователей
    public Integer numberOfRegisteredUsers() {
        return dbService.getCountUser();
    }
    // Количество пользователей Online
    public Integer numberOfAuthUsers() {
        return dbService.getCountSessionList();
    }
    // Получить TOP 10
    public ArrayList<UserProfile> getTop10() {
        return dbService.getTop10();
    }

    // удалить пользователя по email
    public boolean deleteUser(String email) {
        return dbService.deleteUserFromUser(email);
    }
}
