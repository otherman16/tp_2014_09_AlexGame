package account_service;

import junit.framework.TestCase;
import org.junit.*;
import org.mockito.Mockito;
import javax.servlet.http.HttpSession;

public class AccountServiceAnotherTest extends TestCase {

    AccountService service = new AccountService();
    // mock - для того, чтобы имитировать сессию.
    HttpSession httpSession = Mockito.mock(HttpSession.class);

    @Test
    public void testNumberOfRegisterUserOk() throws Exception {
        Integer numberOfRegisteredUsers = service.numberOfRegisteredUsers();
        UserProfile user = new UserProfile("lexa", "lexa@lexa.ru", "lexa");
        service.registerUser(user, httpSession);
        numberOfRegisteredUsers++;
        Assert.assertEquals("opps", numberOfRegisteredUsers, service.numberOfRegisteredUsers());
    }

    @Test
    public void testNumberOfRegisterUserFail() throws Exception {
        Integer numberOfRegisteredUsers = service.numberOfRegisteredUsers();
        UserProfile user = new UserProfile("lexa", "lexa@lexa.ru", "lexa");
        service.registerUser(user, httpSession);
        Assert.assertNotEquals("opps", numberOfRegisteredUsers, service.numberOfRegisteredUsers());
    }

    @Test
    public void testRegisterUserOk() throws Exception {
        boolean result;
        UserProfile user = new UserProfile("lexa", "lexa@lexa.ru", "lexa");
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
        UserProfile user = new UserProfile("lexa", "lexa@lexa.ru", "lexa");
        try {
            if ( !service.registerUser(user, httpSession) ) {
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