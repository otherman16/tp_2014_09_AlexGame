package base;

import javax.servlet.http.HttpSession;
import java.util.ArrayList;

/**
 * Created by aleksei on 19.10.14.
 */
 public interface AccountService {

    public boolean authUser(UserProfile user, HttpSession session);

    public UserProfile getUserBySession(HttpSession session);

    public boolean registerUser(UserProfile user, HttpSession session);

    public boolean logoutUser(HttpSession session);

    public Integer numberOfRegisteredUsers();

    public Integer numberOfAuthUsers();

    public ArrayList<UserProfile> getTop10();

    public boolean deleteUser(String email);

}

