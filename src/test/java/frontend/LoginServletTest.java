package frontend;

import backend.AccountServiceImpl;
import base.AccountService;
import messageSystem.MessageSystem;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import static org.mockito.Mockito.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.PrintWriter;


public class LoginServletTest {

    private MessageSystem ms = new MessageSystem();
    private AccountService service = new AccountServiceImpl(ms);
    private HttpSession httpSession = Mockito.mock(HttpSession.class);
    private LoginServlet loginServlet = new LoginServlet(this.service);
    private HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
    private HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
    private PrintWriter printWriter = Mockito.mock(PrintWriter.class);

    @Before
    public void setUp() throws Exception {

    }

    @After
    public void tearDown() throws Exception {
        service.logoutUser(httpSession);
    }

    private void helpLoginTest(String str) throws IOException {
        byte buf[] = str.getBytes();
        ByteArrayInputStream d = new ByteArrayInputStream(buf);
        DelegatingServletInputStream delegatingServletInputStream = new DelegatingServletInputStream(d);

        when(request.getInputStream()).thenReturn(delegatingServletInputStream);
        when(request.getSession()).thenReturn(httpSession);
        when(response.getWriter()).thenReturn(printWriter);
    }

    @Test
    public void testDoPostOk() throws Exception {
        int curNum = (Integer)service.numberOfAuthUsers().getResponse();
        String str = "{\"email\":\"lexa@lexa.ru\",\"password\":\"lexa\",\"\":\"Login\"}";
        helpLoginTest(str);
        loginServlet.doPost(request, response);
        Assert.assertTrue("LoginServlet Error", (Integer) service.numberOfAuthUsers().getResponse() == curNum + 1);
    }

    @Test
    public void testDoPostFail() throws Exception {
        int curNum = (Integer)service.numberOfAuthUsers().getResponse();
        String str = "{\"email\":\"noSuchUserinDB@lexa.ru\",\"password\":\"lexa\",\"\":\"Login\"}";
        helpLoginTest(str);
        loginServlet.doPost(request, response);
        Assert.assertTrue("testDoPostFail", (Integer) service.numberOfAuthUsers().getResponse() != curNum + 1);
    }

    @Test
    public void testDoPostInvalidJsonFail() throws Exception {
        int curNum = (Integer)service.numberOfAuthUsers().getResponse();
        String str = "{\"badEmailField\":\"lexa@lexa.ru\",\"password\":\"lexa\",\"\":\"Login\"}";
        helpLoginTest(str);
        loginServlet.doPost(request, response);
        Assert.assertTrue("testDoPostInvalidJsonFail Error", (Integer) service.numberOfAuthUsers().getResponse() != curNum + 1);
    }

    @Test
    public void testDoGet() throws Exception {
        loginServlet.doGet(request, response);
        verify(response).setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
        verify(response).sendRedirect("/#");
    }
}