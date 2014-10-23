package backend;

import base.UserProfile;
import junit.framework.TestCase;
import org.eclipse.jetty.server.Authentication;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import javax.servlet.http.HttpSession;

public class AServiceImplRegisterTest extends TestCase {

    AccountServiceImpl service = new AccountServiceImpl();
    HttpSession httpSession = Mockito.mock(HttpSession.class);

    String regLogin = "test";
    String regEmail = "test@test.ru";
    String regPass = "test";
    UserProfile regUser = new UserProfile(regLogin, regEmail, regPass);

    String logoutLogin = "logout";
    String logoutEmail = "logout@logout.ru";
    String logoutPass = "logout";
    UserProfile logoutUser = new UserProfile(logoutLogin, logoutEmail, logoutPass);

    String authLogin = "admin";
    String authEmail = "admin@admin.ru";
    String authPass = "admin";
    UserProfile authUser = new UserProfile(authLogin, authEmail, authPass);

    String wrongPass = "wrong";
    String wrongEmail = "wrong@wrong.ru";
    String wrongLogin = "wrong";
    UserProfile userWrongLogin = new UserProfile(wrongLogin, authEmail, authPass);
    UserProfile userWrongPass = new UserProfile(authLogin, authEmail, wrongPass);
    UserProfile userDelete = new UserProfile(wrongLogin, wrongEmail, wrongPass);

    @Before
    public void setUp () {
        service.deleteUser(regEmail);
        service.deleteUser(logoutEmail);
        service.deleteUser(wrongEmail);
    }

    @After
    public void tearDown() throws Exception {
        boolean result;
        try {
            if ( //service.deleteUser(regEmail)
                    //&& service.deleteUser(logoutEmail)
                     service.deleteUser(wrongEmail) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        }
        Assert.assertTrue("delete user Error", result);
    }

    public void testRegisterUserOk() throws Exception {
        boolean result;
        try {
            if ( service.registerUser(regUser, httpSession) ) {
                result = true;
                //service.deleteUser(regEmail);
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        }
        Assert.assertTrue("registrationOK Error", result);
    }

    public void testRegisterUserFail() throws Exception {
        boolean result;
        try {
            service.registerUser(regUser, httpSession);
            if ( service.registerUser(regUser, httpSession) ) {
                result = false;
            }
            else
                result = true;
        } catch (Exception e) {
            result = true;
        }
        Assert.assertTrue("registrationFail Error", result);
    }

    public void testNumberOfRegisteredUserOK() throws Exception {
        boolean result;
        int curNum = service.numberOfRegisteredUsers();
        try {
            service.registerUser(logoutUser, httpSession);
            if ( service.numberOfRegisteredUsers() == curNum + 1 ) {
                result = true;
                service.deleteUser(logoutEmail);
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        }
        Assert.assertTrue("NumberOfRegistered Error", result);
    }

    public void testNumberOfRegisteredUserFail() throws Exception {
        boolean result;
        int curNum = service.numberOfRegisteredUsers();
        try {
            service.registerUser(logoutUser, httpSession);
            if ( service.numberOfRegisteredUsers() != curNum + 1 ) {
                result = false;
                service.deleteUser(logoutEmail);
            }
            else
                result = true;
        } catch (Exception e) {
            result = true;
        }
        Assert.assertTrue("NumberOfRegistered Error", result);
    }

    public void testDeleteUserOK() throws Exception{
        boolean result = false;
        try {
            service.registerUser(userDelete, httpSession);
            service.deleteUser(wrongEmail);
        } catch (Exception e) {
            result = true;
        }
        Assert.assertFalse(result);
    }

/*  не имееет смысла, deleteUser всегда true, даже когда пользователя нет
    public void testDeleteUserFail() throws Exception{
        boolean result = false;
        try {
            service.registerUser(userDelete, httpSession);
            service.deleteUser("123");
        } catch (Exception e) {
            result = true;
        }
        Assert.assertTrue(result);
    }
*/
}