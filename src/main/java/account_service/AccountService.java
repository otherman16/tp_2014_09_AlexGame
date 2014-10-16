package account_service;

import db_service.DBService;

import javax.servlet.http.HttpSession;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by Алексей on 23.09.2014.
 */
public class AccountService {
    private DBService dbService;

    private Map<Integer, UserProfile> userList = new HashMap<Integer, UserProfile>();
    private Map<Integer, UserProfile> sessionList = new HashMap<Integer, UserProfile>();
    private Long lastID = 0L;
    public AccountService() {
        this.dbService = new DBService("jdbc:mysql://localhost/g06_alexgame_db","alexgame_user","alexgame_user");
        this.addUser_DB(new UserProfile(1L,"admin","admin@admin.ru","admin",1000L));
    }
    /*
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
    */
    //
    //
    //
    //
    // Далее те же методы, но работающие с базой данных MySQL
    //
    //
    //
    //

    // Добавление нового пользователя в базу
    private boolean addUser_DB(UserProfile user) {
        return !this.dbService.hasUserByEmail(user.email) && this.dbService.addUser(user);
    }
    // Проверка корректности введенных пользователем данных
    private boolean isCorUserData_DB(UserProfile user) {
        if (this.dbService.hasUserByEmail(user.email)) {
            UserProfile _user = this.dbService.getUserByEmail(user.email);
            return user.password.equals(_user.password);
        }
        else {
            return false;
        }
    }
    // Запомнить пользователя в Карту сессий
    private boolean rememberUser_DB(UserProfile user, HttpSession session) {
        if( !this.dbService.hasUserBySessionHashCode(session.getId()) ) {
            UserProfile _user = this.dbService.getUserByEmail(user.email);
            session.setAttribute("userId", _user.id);
            return this.dbService.addSession(session.getId(), _user.id);
        }
        else {
            return false;
        }
    }
    // Авторизация пользователя
    public boolean authUser_DB(UserProfile user, HttpSession session) {
        return this.isCorUserData_DB(user) && this.rememberUser_DB(user, session);
    }
    // Получить профиль пользователя по идентификатору сессии
    public UserProfile getUserBySession_DB(HttpSession session) {
        if ( this.dbService.hasUserBySessionHashCode(session.getId()) ) {
            return this.dbService.getUserBySessionHashCode(session.getId());
        }
        else {
            return null;
        }
    }
    // Регистрация пользователя
    public boolean registerUser_DB(UserProfile user, HttpSession session) {
        return this.addUser_DB(user) && this.rememberUser_DB(user,session);
    }
    // Logout пользователя
    public boolean logoutUser_DB(HttpSession session) {
        if (this.dbService.hasUserBySessionHashCode(session.getId()) && this.dbService.removeSessionFromSessionList(session.getId())) {
            session.invalidate();
            return true;
        }
        else {
            return false;
        }
    }
    // Количество зарегестрированныйх пользователей
    public Integer numberOfRegisteredUsers_DB() {
        return this.dbService.getCountUser();
    }
    // Количество пользователей Online
    public Integer numberOfAuthUsers_DB() {
        return this.dbService.getCountSessionList();
    }
    // Получить TOP 10
    public ArrayList<UserProfile> getTop10() {
        return this.dbService.getTop10();
    }

    // удалить пользователя по email
    public boolean deleteUser_DB(String email) {
        return this.dbService.deleteUserFromUser(email);
    }
}
