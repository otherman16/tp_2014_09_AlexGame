package account_service;

import backend.AccountServiceImpl;
import base.UserProfile;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;

import javax.servlet.http.HttpSession;

/**
 * Created by aleksei on 16.10.14.
 */
public class AccountServiceImplAuthTest {

    AccountServiceImpl service = new AccountServiceImpl();

    HttpSession httpSession = Mockito.mock(HttpSession.class);
    String login = "admin";
    String email = "admin@admin.ru";
    String pass = "admin";
    UserProfile user = new UserProfile(login, email, pass);


    @Test
    public void testAuthUserOk() throws Exception {
        boolean result;
        try {
            //service.registerUser(user, httpSession);
            //service.logoutUser(httpSession);
            if ( service.authUser(user, httpSession) ) {
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
