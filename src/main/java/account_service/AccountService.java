package account_service;

import javax.servlet.http.HttpSession;
import java.util.ArrayList;

/**
 * Created by aleksei on 19.10.14.
 */
 public interface AccountService {

    public boolean authUser_DB(UserProfile user, HttpSession session);

    public UserProfile getUserBySession_DB(HttpSession session);

    public boolean registerUser_DB(UserProfile user, HttpSession session);

    public boolean logoutUser_DB(HttpSession session);

    public Integer numberOfRegisteredUsers_DB();

    public Integer numberOfAuthUsers_DB();

    public ArrayList<UserProfile> getTop10();

    public boolean deleteUser_DB(String email);

}

