package account_service;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import javax.servlet.http.HttpSession;

/**
 * Created by aleksei on 16.10.14.
 */
public class AccountServiceAuthTest {

    AccountService service = new AccountService();

    HttpSession httpSession = Mockito.mock(HttpSession.class);
    String login = "admin";
    String email = "admin@admin.ru";
    String pass = "admin";
    UserProfile user = new UserProfile(login, email, pass);


    @Test
    public void testAuthUserOk() throws Exception {
        boolean result;
        try {
            //service.registerUser_DB(user, httpSession);
            //service.logoutUser_DB(httpSession);
            if ( service.authUser_DB(user, httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        }
        Assert.assertTrue("auth Error", result);
    }
}
