package base;

import java.util.ArrayList;

public interface DBService {

    public void addUser(UserProfile user) throws Exception;

    public void addSession(String session_id, Long user_id) throws Exception;

    public boolean hasUserByEmail(String findEmail) throws Exception;

    public boolean hasUserBySessionId(String findSession_id) throws Exception;

    public UserProfile getUserByEmail(String findEmail) throws Exception;

    public UserProfile getUserBySessionId(String findSession_id) throws Exception;

    public void removeSessionFromSessionList(String session_id) throws Exception;

    public int getCountUser() throws Exception;

    public int getCountSessionList() throws Exception;

    public ArrayList<UserProfile> getTop10() throws Exception;

    public void deleteUserFromUser(String email) throws Exception;

}
