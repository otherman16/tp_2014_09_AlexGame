package backend;

import base.AccountServiceError;
import base.UserProfile;
import junit.framework.TestCase;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.mockito.Mockito;

import javax.servlet.http.HttpSession;

public class AServiceImplAuthTest extends TestCase {

    private AccountServiceImpl service = new AccountServiceImpl();
    private HttpSession httpSession = Mockito.mock(HttpSession.class);

    @Before
    public void setUp () {
        service.logoutUser(this.httpSession);
    }

    @After
    public void tearDown () {
        service.logoutUser(this.httpSession);
    }

    private UserProfile getLogoutUser() {
        String logoutLogin = "logout";
        String logoutEmail = "logout@logout.ru";
        String logoutPass = "logout";
        return new UserProfile(logoutLogin, logoutEmail, logoutPass);
    }

    private UserProfile getAuthUser() {
        String authLogin = "admin";
        String authEmail = "admin@admin.ru";
        String authPass = "admin";
        return new UserProfile(authLogin, authEmail, authPass);
    }

    private UserProfile getUserWrongEmail () {
        String authLogin = "admin";
        String authPass = "admin";
        String wrongEmail = "wrong@wrong.ru";
        return new UserProfile(authLogin, wrongEmail, authPass);
    }

    private UserProfile getUserWrongPass () {
        String authLogin = "admin";
        String authEmail = "admin@admin.ru";
        String wrongPass = "wrong";
        return new UserProfile(authLogin, authEmail, wrongPass);
    }

    public void testAuthUserOk() throws Exception {
        try {
            Assert.assertTrue("auth Error", service.authUser(this.getAuthUser(), httpSession).getStatus());
        } catch (Exception e) {
            Assert.fail("exception in testAuthUserOk:\n" + e.getMessage());
        }
    }

    public void testAuthUserAlreadyAuthenticatedFail() throws Exception {
        service.authUser(this.getAuthUser(), httpSession).getStatus();
        try {
            Assert.assertEquals(1, ((AccountServiceError)service.authUser(this.getAuthUser(), httpSession).getResponse()).getCode());
        } catch (Exception e) {
            Assert.fail("exception in testAuthUserAlreadyAuthenticatedFail:\n" + e.getMessage());
        }
    }

    public void testAuthUserByEmailExistFail() throws Exception {
        try {
            Assert.assertEquals(2, ((AccountServiceError)service.authUser(this.getUserWrongEmail(), httpSession).getResponse()).getCode());
        } catch (Exception e) {
            Assert.fail("exception in testAuthUserByEmailExistFail:\n" + e.getMessage());
        }
    }

    public void testAuthUserWrongPassFail() throws Exception {
        try {
            Assert.assertEquals(3, ((AccountServiceError)service.authUser(this.getUserWrongPass(), httpSession).getResponse()).getCode());
        } catch (Exception e) {
            Assert.fail("exception in testAuthUserWrongPassFail:\n" + e.getMessage());
        }
    }

    public void testLogoutUserOK() throws Exception {
        service.registerUser(this.getLogoutUser(), httpSession);
        service.authUser(this.getLogoutUser(), httpSession);
        try {
            Assert.assertTrue("Logout Error", service.logoutUser(httpSession).getStatus());
        } catch (Exception e) {
            Assert.fail("exception in testLogoutUserOK:\n" + e.getMessage());
        } finally {
            service.deleteUser(this.getLogoutUser().getEmail());
        }
    }

    public void testLogoutUserFail() throws Exception {
        try {
            Assert.assertEquals(4, ((AccountServiceError)service.logoutUser(httpSession).getResponse()).getCode());
        } catch (Exception e) {
            Assert.fail("exception in testLogoutUserFail: User does not authenticated.\n" + e.getMessage());
        }
    }

    public void testNumberOfAuthUserOK() throws Exception {
        int curNum = (Integer)service.numberOfAuthUsers().getResponse();
        try {
            service.authUser(this.getAuthUser(), httpSession);
            Assert.assertTrue("NumberOfAuth Error", (Integer)service.numberOfAuthUsers().getResponse() == curNum + 1);
        } catch (Exception e) {
            Assert.fail("exception in testNumberOfAuthUserOK:\n" + e.getMessage());
        }
    }

    public void testNumberOfAuthUserFail() throws Exception {
        int curNum = (Integer)service.numberOfAuthUsers().getResponse();
        try {
            service.authUser(this.getAuthUser(), httpSession);
            Assert.assertFalse("NumberOfAuth Error", (Integer)service.numberOfAuthUsers().getResponse() != curNum + 1);
        } catch (Exception e) {
            Assert.fail("exception in testNumberOfAuthUserFail:\n" + e.getMessage());
        }
    }
}