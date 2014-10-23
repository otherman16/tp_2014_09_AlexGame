package account_service;

import backend.AccountServiceImpl;
import base.UserProfile;
import org.junit.After;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;

import javax.servlet.http.HttpSession;
/**
 * Created by aleksei on 16.10.14.
 */
// при записи в базу инкрементируется id у user. Наверное это не очень хорошо.
public class AccountServiceImplAuthTest {

    AccountServiceImpl service = new AccountServiceImpl();

    HttpSession httpSession = Mockito.mock(HttpSession.class);
    String login = "admin";
    String email = "admin@admin.ru";
    String pass = "admin";
    UserProfile user = new UserProfile(login, email, pass);

    @After
    public void tearDown() throws Exception {
        boolean result;
        try {
            if ( service.logoutUser(httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        }
        Assert.assertTrue("logout user Error", result);
    }

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
