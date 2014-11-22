package frontend;

import backend.AccountServiceImpl;
import base.UserProfile;
import junit.framework.TestCase;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import java.io.PrintWriter;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class GetUserServletTest extends TestCase {

    private AccountServiceImpl service = new AccountServiceImpl();
    private HttpSession httpSession = Mockito.mock(HttpSession.class);
    private GetUserServlet getUserServlet = new GetUserServlet(this.service);
    private HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
    private HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
    private PrintWriter printWriter = Mockito.mock(PrintWriter.class);

    private UserProfile getAdminUser() {
        String authLogin = "admin";
        String authEmail = "admin@admin.ru";
        String authPass = "admin";
        return new UserProfile(authLogin, authEmail, authPass);
    }

    @Before
    public void setUp() throws Exception {
        service.logoutUser(this.httpSession);
    }

    @After
    public void tearDown() throws Exception {
        service.logoutUser(this.httpSession);
    }

    @Test
    public void testDoGetAuth() throws Exception {
        service.authUser(this.getAdminUser(), httpSession);
        when(request.getSession()).thenReturn(httpSession);
        when(response.getWriter()).thenReturn(printWriter);
        getUserServlet.doGet(request, response);
        verify(response).setStatus(HttpServletResponse.SC_OK);
        service.logoutUser(httpSession);
    }

    @Test
    public void testDoGetGuest() throws Exception {
        when(request.getSession()).thenReturn(httpSession);
        when(response.getWriter()).thenReturn(printWriter);
        getUserServlet.doGet(request, response);
        verify(response).setStatus(HttpServletResponse.SC_OK);
    }

    @Test
    public void testDoPost() throws Exception {
        getUserServlet.doPost(request, response);
        verify(response).setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
    }
}