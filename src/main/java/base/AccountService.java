package base;

import javax.servlet.http.HttpSession;
import java.util.ArrayList;

 public interface AccountService {

    public AccountServiceResponse authUser(UserProfile user, HttpSession session);

    public AccountServiceResponse getUserBySession(HttpSession session);

    public AccountServiceResponse registerUser(UserProfile user, HttpSession session);

    public AccountServiceResponse logoutUser(HttpSession session);

    public AccountServiceResponse numberOfRegisteredUsers();

    public AccountServiceResponse numberOfAuthUsers();

    public AccountServiceResponse getTop10();

    public AccountServiceResponse deleteUser(String email);

}

