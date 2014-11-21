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
        Assert.assertTrue("auth Error", service.authUser(this.getAuthUser(), httpSession).getStatus());
    }

    public void testAuthUserAlreadyAuthenticatedFail() throws Exception {
        service.authUser(this.getAuthUser(), httpSession).getStatus();
        Assert.assertEquals("IsAuthError", ((AccountServiceError)service.authUser(this.getAuthUser(), httpSession).getResponse()).getCode());
    }

    public void testAuthUserByEmailExistFail() throws Exception {
        Assert.assertEquals("WrongEmailError", ((AccountServiceError)service.authUser(this.getUserWrongEmail(), httpSession).getResponse()).getCode());
    }

    public void testAuthUserWrongPassFail() throws Exception {
        Assert.assertEquals("WrongPasswordError", ((AccountServiceError)service.authUser(this.getUserWrongPass(), httpSession).getResponse()).getCode());
    }

    public void testLogoutUserOK() throws Exception {
        service.registerUser(this.getLogoutUser(), httpSession);
        service.authUser(this.getLogoutUser(), httpSession);
        Assert.assertTrue("Logout Error", service.logoutUser(httpSession).getStatus());
        service.deleteUser(this.getLogoutUser().getEmail());
    }

    public void testLogoutUserFail() throws Exception {
        Assert.assertEquals("NotAuthError", ((AccountServiceError)service.logoutUser(httpSession).getResponse()).getCode());
    }

    public void testNumberOfAuthUserOK() throws Exception {
        int curNum = (Integer)service.numberOfAuthUsers().getResponse();
        service.authUser(this.getAuthUser(), httpSession);
        Assert.assertTrue("NumberOfAuth Error", (Integer)service.numberOfAuthUsers().getResponse() == curNum + 1);
    }

    public void testNumberOfAuthUserFail() throws Exception {
        int curNum = (Integer)service.numberOfAuthUsers().getResponse();
        service.authUser(this.getAuthUser(), httpSession);
        Assert.assertFalse("NumberOfAuth Error", (Integer)service.numberOfAuthUsers().getResponse() != curNum + 1);
    }
}