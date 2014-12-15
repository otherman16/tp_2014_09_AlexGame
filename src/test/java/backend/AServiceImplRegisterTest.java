package backend;
import base.AccountServiceError;
import base.UserProfile;
import junit.framework.TestCase;
import messageSystem.MessageSystem;
import org.junit.After;
import org.junit.Before;
import org.junit.Assert;
import org.mockito.Mockito;
import javax.servlet.http.HttpSession;

public class AServiceImplRegisterTest extends TestCase {

    private MessageSystem ms = new MessageSystem();

    private AccountServiceImpl service = new AccountServiceImpl(ms);
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
        service.logoutUser(this.httpSession);
        service.deleteUser(this.getRegUser().getEmail());
        service.deleteUser(this.getOkUser().getEmail());
    }
    @After
    public void tearDown () {
        service.logoutUser(this.httpSession);
        service.deleteUser(this.getRegUser().getEmail());
        service.deleteUser(this.getOkUser().getEmail());
    }
    public void testRegisterUserOk() throws Exception {
        Assert.assertTrue("registrationOK Error", service.registerUser(this.getRegUser(), httpSession).getStatus());
    }
    public void testRegisterUserFail() throws Exception {
        service.registerUser(this.getRegUser(), httpSession);
        Assert.assertEquals(AccountServiceError.UserExistsError, (service.registerUser(this.getRegUser(), httpSession).getResponse()));
    }
    public void testNumberOfRegisteredUserOK() throws Exception {
        int curNum = (int)service.numberOfRegisteredUsers().getResponse();
        service.registerUser(this.getOkUser(), httpSession);
        Assert.assertEquals("NumberOfRegistered Error", (int)service.numberOfRegisteredUsers().getResponse(), curNum + 1);
        service.deleteUser(this.getOkUser().getEmail());
    }
    public void testNumberOfRegisteredUserFail() throws Exception {
        int curNum = (int)service.numberOfRegisteredUsers().getResponse();
        service.registerUser(this.getOkUser(), httpSession);
        Assert.assertNotEquals("NumberOfRegistered Error", (int)service.numberOfRegisteredUsers().getResponse(), curNum);
        service.deleteUser(this.getOkUser().getEmail());
    }
}

