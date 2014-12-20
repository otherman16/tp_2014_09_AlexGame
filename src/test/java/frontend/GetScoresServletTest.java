package frontend;

import backend.AccountServiceImpl;
import base.AccountService;
import messageSystem.MessageSystem;
import org.junit.Test;
import org.mockito.Mockito;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.PrintWriter;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class GetScoresServletTest {

    private MessageSystem ms = new MessageSystem();
    private AccountService service = new AccountServiceImpl(ms);
    private GetScoresServlet getScoresServlet = new GetScoresServlet(this.service);
    private HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
    private HttpServletResponse response = Mockito.mock(HttpServletResponse.class);
    private PrintWriter printWriter = Mockito.mock(PrintWriter.class);


    @Test
    public void testDoGet() throws Exception {
        when(response.getWriter()).thenReturn(printWriter);
        getScoresServlet.doGet(request, response);
    }

    @Test
    public void testDoPost() throws Exception {
        getScoresServlet.doPost(request, response);
        verify(response).setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
    }
}