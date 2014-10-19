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
public class AccountServiceImpl implements AccountService {
    private DBService dbService;

    public AccountServiceImpl() {
        this.dbService = new DBService("jdbc:mysql://localhost/g06_alexgame_db","alexgame_user","alexgame_user");
        this.addUser_DB(new UserProfile(1L,"admin","admin@admin.ru","admin",1000L));
    }

    // Добавление нового пользователя в базу
    private boolean addUser_DB(UserProfile user) {
        return !this.dbService.hasUserByEmail(user.getEmail()) && this.dbService.addUser(user);
    }
    // Проверка корректности введенных пользователем данных
    private boolean isCorUserData_DB(UserProfile user) {
        if (this.dbService.hasUserByEmail(user.getEmail())) {
            UserProfile _user = this.dbService.getUserByEmail(user.getEmail());
            return user.getPassword().equals(_user.getPassword());
        }
        else {
            return false;
        }
    }
    // Запомнить пользователя в Карту сессий
    private boolean rememberUser_DB(UserProfile user, HttpSession session) {
        if( !this.dbService.hasUserBySessionHashCode(session.getId()) ) {
            UserProfile _user = this.dbService.getUserByEmail(user.getEmail());
            session.setAttribute("userId", _user.getId());
            return this.dbService.addSession(session.getId(), _user.getId());
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
