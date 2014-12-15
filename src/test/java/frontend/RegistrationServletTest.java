package frontend;

import backend.AccountServiceImpl;
import messageSystem.MessageSystem;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import static org.mockito.Mockito.verify;

public class RegistrationServletTest {

    private MessageSystem ms = new MessageSystem();

    private AccountServiceImpl service = new AccountServiceImpl(ms);
    private HttpSession httpSession = Mockito.mock(HttpSession.class);
    private RegistrationServlet registrationServlet = new RegistrationServlet(this.service);
    private HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
    private HttpServletResponse response = Mockito.mock(HttpServletResponse.class);

    @Before
    public void setUp() throws Exception {

    }

    @After
    public void tearDown() throws Exception {

    }

    @Test
    public void testDoGet() throws Exception {

    }

    @Test
    public void testDoPost() throws Exception {
        registrationServlet.doGet(request, response);
        verify(response).setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
        verify(response).sendRedirect("/#");
    }
}