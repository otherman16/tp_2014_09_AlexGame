package frontend;

import backend.AccountServiceImpl;
import base.UserProfile;
import junit.framework.TestCase;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import java.io.PrintWriter;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class LogoutServletTest extends TestCase {

    private AccountServiceImpl service = new AccountServiceImpl();
    private HttpSession httpSession = Mockito.mock(HttpSession.class);
    private LogoutServlet logoutServlet = new LogoutServlet(this.service);
    private HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
    private HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
    private PrintWriter printWriter = Mockito.mock(PrintWriter.class);

    private UserProfile getLogoutUser() {
        String logoutLogin = "login";
        String logoutEmail = "login@login.ru";
        String logoutPass = "login";
        return new UserProfile(logoutLogin, logoutEmail, logoutPass);
    }

    @Before
    public void setUp() throws Exception {
        service.deleteUser(getLogoutUser().getEmail());
    }

    @After
    public void tearDown() throws Exception {
        UserProfile user = this.getLogoutUser();
        service.registerUser(user, httpSession); // здесь по умолчанию пользователь в session list добавляется после регистрации
    }

    @Test
    public void testDoPostOk() throws Exception {
        try {
            when(request.getSession()).thenReturn(httpSession);
            when(response.getWriter()).thenReturn(printWriter);
            logoutServlet.doPost(request, response);
            verify(response).setStatus(HttpServletResponse.SC_OK);
        } catch (Exception e) {
            Assert.fail("exception in testLogoutServletDoPostOk:\n" + e.getMessage());
        }
    }

    @Test
    public void testDoPostFail() throws Exception {
        try {
            service.logoutUser(httpSession);
            when(request.getSession()).thenReturn(httpSession);
            when(response.getWriter()).thenReturn(printWriter);
            logoutServlet.doPost(request, response);
            verify(response).setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            Assert.fail("exception in testLogoutServletDoPostFail:\n" + e.getMessage());
        }
    }

    @Test
    public void testDoGetOk() throws Exception {
        try {
            logoutServlet.doGet(request, response);
            verify(response).setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            verify(response).sendRedirect("/#");
        } catch (Exception e) {
            Assert.fail("exception in testLogoutServletDoGetOk:\n" + e.getMessage());
        }
    }
    // нужен ли тест testDoGetFail?
}