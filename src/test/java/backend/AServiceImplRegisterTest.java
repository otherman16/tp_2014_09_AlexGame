package backend;

import base.UserProfile;
import junit.framework.TestCase;
import org.junit.Before;
import org.junit.Assert;
import org.mockito.Mockito;

import javax.servlet.http.HttpSession;

public class AServiceImplRegisterTest extends TestCase {

    AccountServiceImpl service = new AccountServiceImpl();
    HttpSession httpSession = Mockito.mock(HttpSession.class);

    String regLogin = "test";
    String regEmail = "test@test.ru";
    String regPass = "test";
    UserProfile regUser = new UserProfile(regLogin, regEmail, regPass);

    String okLogin = "ok";
    String okEmail = "ok@ok.ru";
    String okPass = "ok";
    UserProfile okUser = new UserProfile(okLogin, okEmail, okPass);

    @Before
    public void setUp () {
        service.deleteUser(regEmail);
        service.deleteUser(okEmail);
    }

    public void testRegisterUserOk() throws Exception {
        boolean result;
        try {
            if ( service.registerUser(regUser, httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        } finally {
            service.deleteUser(regEmail);
        }
        Assert.assertTrue("registrationOK Error", result);
    }

    public void testRegisterUserFail() throws Exception {
        boolean result;
        try {
            service.registerUser(regUser, httpSession);
            if ( service.registerUser(regUser, httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        } finally {
            service.deleteUser(regEmail);
        }
        Assert.assertFalse("registrationFail Error", result);
    }

    public void testNumberOfRegisteredUserOK() throws Exception {
        boolean result;
        int curNum = service.numberOfRegisteredUsers();
        try {
            service.registerUser(okUser, httpSession);
            if ( service.numberOfRegisteredUsers() == curNum + 1 ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        } finally {
            service.deleteUser(okEmail);
        }
        Assert.assertTrue("NumberOfRegistered Error", result);
    }

    public void testNumberOfRegisteredUserFail() throws Exception {
        boolean result;
        int curNum = service.numberOfRegisteredUsers();
        try {
            service.registerUser( okUser, httpSession);
            if ( service.numberOfRegisteredUsers() != curNum + 1 ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        } finally {
            service.deleteUser(okEmail);
        }
        Assert.assertFalse("NumberOfRegistered Error", result);
    }
}