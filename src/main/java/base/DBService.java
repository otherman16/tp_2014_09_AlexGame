package base;

import java.util.ArrayList;

/**
 * Created by Алексей on 20.10.2014.
 */
public interface DBService {

    // Добавить запись в таблице "user"
    public boolean addUser(UserProfile user);

    // Добавить запись в таблице "session_list"
    public boolean addSession(String session_id, Long user_id);

    // Проверить наличие профиля пользователя по email в таблице "user"
    public boolean hasUserByEmail(String findEmail);

    // Проверить наличие сессии по session_hashCode в таблице "session_list"
    public boolean hasUserBySessionHashCode(String findSession_id);

    // Получить профиль пользователя по email из таблицы "user"
    public UserProfile getUserByEmail(String findEmail);

    // Получить профиль пользователя по session_hashCode из таблицы "session_list"
    public UserProfile getUserBySessionHashCode(String findSession_id);

    // Удалить запись из таблицы "session_list" по session_hashCode
    public boolean removeSessionFromSessionList(String session_id);

    // Получить количество записей в таблице "user"
    public Integer getCountUser();

    // Получить количество записей в таблице "session_list"
    public Integer getCountSessionList();

    // Получить TOP 10
    public ArrayList<UserProfile> getTop10();
    // Удалить пользователя из user по email. Нужно для тестов.
    public boolean deleteUserFromUser(String email);

}
