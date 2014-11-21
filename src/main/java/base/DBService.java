package base;

import java.util.ArrayList;

public interface DBService {

    void addUser(UserProfile user) throws Exception;

    void addSession(String session_id, Long user_id) throws Exception;

    Boolean isUserExistsByEmail(String findEmail) throws Exception;

    Boolean isSessionExistsBySessionId(String findSession_id) throws Exception;

    UserProfile getUserByEmail(String findEmail) throws Exception;

    UserProfile getUserBySessionId(String findSession_id) throws Exception;

    void deleteSession(String session_id) throws Exception;

    Integer getCountUser() throws Exception;

    Integer getCountSessionList() throws Exception;

    ArrayList<UserProfile> getTop10() throws Exception;

    void deleteUser(String email) throws Exception;

}
