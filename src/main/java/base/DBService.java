package base;

import java.util.ArrayList;

public interface DBService {

    public void addUser(UserProfile user) throws Exception;

    public void addSession(String session_id, Long user_id) throws Exception;

    public Boolean isUserExistsByEmail(String findEmail) throws Exception;

    public Boolean isSessionExistsBySessionId(String findSession_id) throws Exception;

    public UserProfile getUserByEmail(String findEmail) throws Exception;

    public UserProfile getUserBySessionId(String findSession_id) throws Exception;

    public void deleteSession(String session_id) throws Exception;

    public Integer getCountUser() throws Exception;

    public Integer getCountSessionList() throws Exception;

    public ArrayList<UserProfile> getTop10() throws Exception;

    public void deleteUser(String email) throws Exception;

}
