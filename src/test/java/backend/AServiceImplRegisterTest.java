package backend;

import base.AccountService;
import base.AccountServiceError;
import base.UserProfile;
import junit.framework.TestCase;
import org.junit.After;
import org.junit.Before;
import org.junit.Assert;
import org.mockito.Mockito;

import javax.servlet.http.HttpSession;

public class AServiceImplRegisterTest extends TestCase {

    private AccountService service = new AccountServiceImpl();
    private HttpSession httpSession = Mockito.mock(HttpSession.class);

    private UserProfile getRegUser() {
        String regLogin = "test";
        String regEmail = "test@test.ru";
        String regPass = "test";
        return new UserProfile(regLogin, regEmail, regPass);
    }

    private UserProfile getOkUser() {
        String okLogin = "ok";
        String okEmail = "ok@ok.ru";
        String okPass = "ok";
        return new UserProfile(okLogin, okEmail, okPass);
    }

    @Before
    public void setUp() {
        service.deleteUser(this.getRegUser().getEmail());
        service.deleteUser(this.getOkUser().getEmail());
    }

    @After
    public void tearDown () {
        service.deleteUser(this.getRegUser().getEmail());
        service.deleteUser(this.getOkUser().getEmail());
    }

    public void testRegisterUserOk() throws Exception {
        try {
            Assert.assertTrue("registrationOK Error", service.registerUser(this.getRegUser(), httpSession).getStatus());
        } catch (Exception e) {
            Assert.fail("Exception in testRegisterUserOk:\n" + e.getMessage());
        }
    }

    public void testRegisterUserFail() throws Exception {
        try {
            service.registerUser(this.getRegUser(), httpSession);
            Assert.assertEquals(5, ((AccountServiceError)service.registerUser(this.getRegUser(), httpSession).getResponse()).getCode());
        } catch (Exception e) {
            Assert.fail("Exception in testRegisterUserFail:\n" + e.getMessage());
        }
    }

    public void testNumberOfRegisteredUserOK() throws Exception {
        try {
            int curNum = (int)service.numberOfRegisteredUsers().getResponse();
            service.registerUser(this.getOkUser(), httpSession);
            Assert.assertEquals("NumberOfRegistered Error", (int)service.numberOfRegisteredUsers().getResponse(), curNum + 1);
        } catch (Exception e) {
            Assert.fail("Exception in testNumberOfRegisteredUserOK:\n" + e.getMessage());
        }
    }

    public void testNumberOfRegisteredUserFail() throws Exception {
        try {
            int curNum = (int)service.numberOfRegisteredUsers().getResponse();
            service.registerUser(this.getOkUser(), httpSession);
            Assert.assertNotEquals("NumberOfRegistered Error", (int)service.numberOfRegisteredUsers().getResponse(), curNum);
        } catch (Exception e) {
            Assert.fail("Exception in testNumberOfRegisteredUserFail:\n" + e.getMessage());
        }
    }
}