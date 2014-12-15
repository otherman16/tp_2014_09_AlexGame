package frontend;

import backend.AccountServiceImpl;
import base.UserProfile;
import junit.framework.TestCase;
import messageSystem.MessageSystem;
import org.mockito.Mockito;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import java.io.PrintWriter;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class LogoutServletTest extends TestCase {

    private MessageSystem ms = new MessageSystem();

    private AccountServiceImpl service = new AccountServiceImpl(ms);
    private HttpSession httpSession = Mockito.mock(HttpSession.class);
    private LogoutServlet logoutServlet = new LogoutServlet(this.service);
    private HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
    private HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
    private PrintWriter printWriter = Mockito.mock(PrintWriter.class);

    private UserProfile getAdminUser() {
        String authLogin = "admin";
        String authEmail = "admin@admin.ru";
        String authPass = "admin";
        return new UserProfile(authLogin, authEmail, authPass);
    }

    public void testDoPostOk() throws Exception {
        service.authUser(getAdminUser(), httpSession);
        when(request.getSession()).thenReturn(httpSession);
        when(response.getWriter()).thenReturn(printWriter);
        logoutServlet.doPost(request, response);
        verify(response).setStatus(HttpServletResponse.SC_OK);
        service.logoutUser(httpSession);
    }

    public void testDoPostFail() throws Exception {
        when(request.getSession()).thenReturn(httpSession);
        when(response.getWriter()).thenReturn(printWriter);
        logoutServlet.doPost(request, response);
        verify(response).setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        service.logoutUser(httpSession);
    }

    public void testDoGetOk() throws Exception {
        logoutServlet.doGet(request, response);
        verify(response).setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
        verify(response).sendRedirect("/#");
    }
}