package base;

import java.util.ArrayList;

public interface DBService {

    public void addUser(UserProfile user) throws Exception;

    public void addSession(String session_id, Long user_id) throws Exception;

    public Boolean hasUserByEmail(String findEmail) throws Exception;

    public Boolean hasUserBySessionId(String findSession_id) throws Exception;

    public UserProfile getUserByEmail(String findEmail) throws Exception;

    public UserProfile getUserBySessionId(String findSession_id) throws Exception;

    public void removeSessionFromSessionList(String session_id) throws Exception;

    public Integer getCountUser() throws Exception;

    public Integer getCountSessionList() throws Exception;

    public ArrayList<UserProfile> getTop10() throws Exception;

    public void deleteUserFromUser(String email) throws Exception;

}
