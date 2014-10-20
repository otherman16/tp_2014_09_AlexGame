package base;

import java.util.ArrayList;

public interface DBService {

    public boolean addUser(UserProfile user);

    public boolean addSession(String session_id, Long user_id);

    public boolean hasUserByEmail(String findEmail);

    public boolean hasUserBySessionHashCode(String findSession_id);

    public UserProfile getUserByEmail(String findEmail);

    public UserProfile getUserBySessionHashCode(String findSession_id);

    public boolean removeSessionFromSessionList(String session_id);

    public Integer getCountUser();

    public Integer getCountSessionList();

    public ArrayList<UserProfile> getTop10();

    public boolean deleteUserFromUser(String email);

}
