package frontend;

import javax.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by otherman on 15.09.14.
 */
public class AccountService {

    private Map<String, UserProfile> userList = new HashMap<String, UserProfile>();
    private Map<String, UserProfile> sessionList = new HashMap<String, UserProfile>();

//  Проверка на наличие Email в базе
    private boolean isUser(UserProfile user) {
        if (userList.containsKey(user.email)) {
            return true;
        }
        else {
            return false;
        }
    }

//  Добавление нового пользователя в базу
    private void addUser(UserProfile user) {
        userList.put(user.email,user);
    }

//  Проверка корректности введенных пользователем данных
    private boolean isCorUserData(UserProfile user) {
        if (this.isUser(user)) {
            UserProfile _user = userList.get(user.email);
            if (user.password.equals(_user.password)) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }

//  Запомнить пользователя в Карту сессий
    private void rememberUser(UserProfile user, String session) {
        sessionList.put(session, user);
    }

//  Проверка на наличие пользователя в Карте сессий на авторизацию
    private boolean isAuth(String session) {
        if (sessionList.containsKey(session)) {
            return true;
        }
        else {
            return false;
        }
    }

//  Авторизация пользователя
    public boolean authUser(UserProfile user, HttpSession session) {
        if (this.isCorUserData(user)) {
            session.setAttribute("userId", user.email);
            this.rememberUser(user, session.toString());
            return true;
        }
        else {
            return false;
        }
    }

//  Получить профиль пользователя по идентификатору сессии
    public UserProfile getUserBySession(String session) {
        if (this.isAuth(session)) {
            return sessionList.get(session);
        }
        else {
            return null;
        }
    }

//  Регистрация пользователя
    public boolean registerUser(UserProfile user, HttpSession session) {
        if (this.isUser(user)) {
            return false;
        }
        else {
            this.addUser(user);
            session.setAttribute("userId", user.email);
            this.rememberUser(user, session.toString());
            return true;
        }
    }

}
