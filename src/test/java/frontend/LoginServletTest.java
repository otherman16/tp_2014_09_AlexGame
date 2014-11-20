package frontend;

import backend.AccountServiceImpl;
import base.AccountService;
import base.UserProfile;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;
import static org.mockito.Mockito.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.xml.ws.Response;

import org.mockito.internal.invocation.Invocation;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

import static org.junit.Assert.*;

public class LoginServletTest {


    private JSONObject jsonObj = Mockito.mock(JSONObject.class);
    private AccountServiceImpl service = new AccountServiceImpl();
    private HttpSession httpSession = Mockito.mock(HttpSession.class);
    private LoginServlet loginServlet = new LoginServlet(this.service);
    private HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
    //private HttpServletRequest request = new MockHttpServletRequest("GET", "/login");
    private HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
    //private HttpServletResponse response = new MockHttpServletResponse();
    private InputStream inputStream = Mockito.mock(InputStream.class);

    private UserProfile getLoginUser() {
        String loginLogin = "login";
        String loginEmail = "login@login.ru";
        String loginPass = "login";
        return new UserProfile(loginLogin, loginEmail, loginPass);
    }

    @Before
    public void setUp() throws Exception {

    }

    @After
    public void tearDown() throws Exception {

    }

    private InputStream myRequest() throws Exception {
        String exampleString = "{email: 'login@login.ru, pass: login}";
        InputStream stream = new ByteArrayInputStream(exampleString.getBytes(StandardCharsets.UTF_8));
        return stream;
    }

    @Test
    public void testDoPost() throws Exception {
        try {
            UserProfile user = this.getLoginUser();
            service.registerUser(user, httpSession);
            service.logoutUser(httpSession);
            //service.logoutUser(httpSession);
            String exampleString = "{email: 'login@login.ru, pass: login}";
            InputStream stream = new ByteArrayInputStream(exampleString.getBytes(StandardCharsets.UTF_8));

            BufferedReader a = new BufferedReader(new InputStreamReader(stream));
            //when(request.getInputStream()).thenReturn();
            //when(request.getInputStream()).thenAnswer((Answer<?>) (InputStream)new ByteArrayInputStream(exampleString.getBytes(StandardCharsets.UTF_8)));
            //when(new BufferedReader(new InputStreamReader(request.getInputStream()))).thenReturn(a);
            //jsonObj.put("email", "login@login.ru");
            //jsonObj.put("pass", "login");
            /*when(request.getInputStream()).thenAnswer(new Answer<InputStream>() {
                InputStream answer(InvocationOnMock invocation) {
                    String exampleString = "{email: 'login@login.ru, pass: login}";
                    InputStream stream = new ByteArrayInputStream(exampleString.getBytes(StandardCharsets.UTF_8));
                    //Object[] args = invocation.getArguments();
                    //Object mock = invocation.getMock();
                    return stream;
                }
            });*/
            //when(httpSession.getId()).thenReturn(user.getSessionId());
            //when(jsonObj.getString("email")).thenReturn(user.getEmail());
            //when(jsonObj.getString("pass")).thenReturn(user.getPassword());
            //when(request.getParameter("email")).thenReturn("login@login.ru");
            //when(request.getParameter("password")).thenReturn("login");
            //when(request.getSession()).thenReturn(httpSession);

            //loginServlet.doPost(request, response);

            //verify(response).setStatus(HttpServletResponse.SC_OK);
            //System.out.println(response.getStatus());
            //Assert.assertEquals(0, this.response.getStatus());
        } catch (Exception e) {
            Assert.fail("exception in testLoginServlet:\n" + e.getMessage());
        }
        finally {
            service.logoutUser(httpSession);
            service.deleteUser(getLoginUser().getEmail());
        }
    }

    @Test
    public void testDoGet() throws Exception {
        try {
            loginServlet.doGet(request, response);
            verify(response).setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            verify(response).sendRedirect("/#");
        } catch (Exception e) {
            Assert.fail("exception in testAuthUserOk:\n" + e.getMessage());
        }
    }
}