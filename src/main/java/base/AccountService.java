package base;

import messageSystem.Abonent;

import javax.servlet.http.HttpSession;

 public interface AccountService extends Runnable, Abonent {

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