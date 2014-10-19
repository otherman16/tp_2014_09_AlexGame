package account_service;

import backend.AccountServiceImpl;
import base.UserProfile;
import junit.framework.TestCase;
import org.junit.*;
import org.mockito.Mockito;
import javax.servlet.http.HttpSession;

public class AccountServiceImplAnotherTest extends TestCase {

    AccountServiceImpl service = new AccountServiceImpl();
    // mock - для того, чтобы имитировать сессию.
    HttpSession httpSession = Mockito.mock(HttpSession.class);

    String login = "test";
    String email = "test@test.ru";
    String pass = "test";
    UserProfile user = new UserProfile(login, email, pass);

    @Before
    public void setUp () {
        service.deleteUser(email);
    }

    @After
    public void tearDown() throws Exception {
        boolean result;
        try {
            if (service.deleteUser(email)) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        }
        Assert.assertTrue("delete user Error", result);
    }

    @Test
    public void testRegisterUserOk() throws Exception {
        boolean result;
        try {
            if ( service.registerUser(user, httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        }
        Assert.assertTrue("registration Error", result);
    }

    @Test
    public void testRegisterUserFail() throws Exception {
        boolean result;
        try {
            service.registerUser(user, httpSession);
            if ( service.registerUser(user, httpSession) ) {
                result = false;
            }
            else
                result = true;
        } catch (Exception e) {
            result = true;
        }
        Assert.assertTrue("registration Error", result);
    }
}