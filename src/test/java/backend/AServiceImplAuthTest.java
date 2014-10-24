package backend;

import base.UserProfile;
import junit.framework.TestCase;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.mockito.Mockito;

import javax.servlet.http.HttpSession;

public class AServiceImplAuthTest extends TestCase {

    AccountServiceImpl service = new AccountServiceImpl();
    HttpSession httpSession = Mockito.mock(HttpSession.class);

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
    UserProfile userWrongEmail = new UserProfile(authLogin, wrongEmail, authPass);
    UserProfile userWrongPass = new UserProfile(authLogin, authEmail, wrongPass);

    @BeforeClass
    public void setUp () {
        service.logoutUser(httpSession);
        service.deleteUser(logoutEmail);
    }

    public void testAuthUserOk() throws Exception {
        boolean result;
        service.logoutUser(httpSession);
        try {
            if ( service.authUser(authUser, httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        } finally {
            service.logoutUser(httpSession);
        }
        Assert.assertTrue("auth Error", result);
    }

    public void testAuthUserLoginFail() throws Exception {
        boolean result;
        try {
            if ( service.authUser(userWrongEmail, httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        } finally {
            service.logoutUser(httpSession);
        }
        Assert.assertFalse("auth Error", result);
    }

    public void testAuthUserPassFail() throws Exception {
        boolean result;
        try {
            if ( service.authUser(userWrongPass, httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        } finally {
            service.logoutUser(httpSession);
        }
        Assert.assertFalse("auth Error", result);
    }

    public void testLogoutUserOK() throws Exception {
        boolean result;
        service.registerUser(logoutUser, httpSession);
        service.authUser(logoutUser, httpSession);
        try {
            if ( service.logoutUser(httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        } finally {
            service.deleteUser(logoutEmail);
        }
        Assert.assertTrue("Logout Error", result);
    }

    public void testLogoutUserFail() throws Exception {
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
        Assert.assertFalse("Logout Error", result);
    }

    public void testNumberOfAuthUserOK() throws Exception {
        boolean result;
        int curNum = service.numberOfAuthUsers();
        try {
            service.authUser(authUser, httpSession);
            if ( service.numberOfAuthUsers() == curNum + 1 ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        } finally {
            service.logoutUser(httpSession);
        }
        Assert.assertTrue("NumberOfAuth Error", result);
    }

    public void testNumberOfAuthUserFail() throws Exception {
        boolean result;
        int curNum = service.numberOfAuthUsers();
        try {
            service.authUser(authUser, httpSession);
            if ( service.numberOfAuthUsers() != curNum + 1 ) {
                result = true;
            }
            else
                result = false;
            service.logoutUser(httpSession);
        } catch (Exception e) {
            result = false;
        } finally {
            service.logoutUser(httpSession);
        }
        Assert.assertFalse("NumberOfAuth Error", result);
    }
}