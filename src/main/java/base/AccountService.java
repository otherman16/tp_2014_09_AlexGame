package base;

import javax.servlet.http.HttpSession;
import java.util.ArrayList;

 public interface AccountService extends Runnable {

    AccountServiceResponse authUser(UserProfile user, HttpSession session);

    AccountServiceResponse getUserBySession(HttpSession session);

    AccountServiceResponse registerUser(UserProfile user, HttpSession session);

    AccountServiceResponse logoutUser(HttpSession session);

    AccountServiceResponse numberOfRegisteredUsers();

    AccountServiceResponse numberOfAuthUsers();

    AccountServiceResponse getTop10();

    AccountServiceResponse increaseScore(String findEmail, int scoreToIncrease);

    AccountServiceResponse deleteUser(String email);

}