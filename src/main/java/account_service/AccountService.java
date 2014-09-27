package account_service;

import javax.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by Алексей on 23.09.2014.
 */
public class AccountService {
    private Map<Integer, UserProfile> userList = new HashMap<Integer, UserProfile>();
    private Map<Integer, UserProfile> sessionList = new HashMap<Integer, UserProfile>();
    private Long lastID = 0L;
    public AccountService() {
        UserProfile user = new UserProfile("admin","admin","admin");
        this.addUser(user);
    }
    // Генерация уникального ID
    private Long getNewId() {
        return ++lastID;
    }
    // Проверка на наличие Email в базе
    private boolean isUser(String email) {
        return userList.containsKey(email.hashCode());
    }
    // Добавление нового пользователя в базу
    private boolean addUser(UserProfile user) {
        if( this.isUser(user.email)) {
            return false;
        }
        else {
            user.id = this.getNewId();
            userList.put(user.email.hashCode(),user);
            return true;
        }
    }
    // Проверка корректности введенных пользователем данных
    private boolean isCorUserData(UserProfile user) {
        if (this.isUser(user.email)) {
            UserProfile _user = userList.get(user.email.hashCode());
            return user.password.equals(_user.password);
        }
        else {
            return false;
        }
    }
    // Запомнить пользователя в Карту сессий
    private boolean rememberUser(UserProfile user, HttpSession session) {
        if( !this.isAuth(session.toString()) ) {
            UserProfile _user = userList.get(user.email.hashCode());
            session.setAttribute("userId", _user.id);
            sessionList.put(session.toString().hashCode(), _user);
            return true;
        }
        else {
            return false;
        }
    }
    // Забыть пользователя и удалить сессию из Карты сессий
    private boolean forgetUser(String session) {
        if( this.isAuth(session) ) {
            sessionList.remove(session.hashCode());
            return true;
        }
        else {
            return false;
        }
    }
    // Проверка на наличие пользователя в Карте сессий на авторизацию
    private boolean isAuth(String session) {
        return sessionList.containsKey(session.hashCode());
    }
    // Авторизация пользователя
    public boolean authUser(UserProfile user, HttpSession session) {
        return this.isCorUserData(user) && this.rememberUser(user, session);
    }
    // Получить профиль пользователя по идентификатору сессии
    public UserProfile getUserBySession(String session) {
        if (this.isAuth(session)) {
            return sessionList.get(session.hashCode());
        }
        else {
            return null;
        }
    }
    // Регистрация пользователя
    public boolean registerUser(UserProfile user, HttpSession session) {
        return this.addUser(user) && this.rememberUser(user,session);
    }
    // Logout пользователя
    public boolean logoutUser(HttpSession session) {
        if (this.forgetUser(session.toString())) {
            session.invalidate();
            return true;
        }
        else {
            return false;
        }
    }
    // Количество зарегестрированныйх пользователей
    public Integer numberOfRegisteredUsers() {
        return userList.size();
    }
    // Количество пользователей Online
    public Integer numberOfAuthUsers() {
        return sessionList.size();
    }
}