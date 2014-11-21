package frontend;

import base.AccountService;
import base.AccountServiceError;
import base.AccountServiceResponse;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class LogoutServlet extends HttpServlet {
    private AccountService service;
    public LogoutServlet(AccountService service) {
        this.service = service;
    }
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        response.sendRedirect("/#");
        response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
    }
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
        AccountServiceResponse resp = service.logoutUser(request.getSession());
        if (resp.getStatus()) {
            success(response, (String)resp.getResponse());
        }
        else {
            error(response, (AccountServiceError)resp.getResponse());
        }
    }
    private void error(HttpServletResponse response, AccountServiceError error) throws ServletException, IOException {
        JSONObject jsnObj = new JSONObject().put("message", error.getMessage());
        response.getWriter().print(jsnObj.toString());
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }
    private void success(HttpServletResponse response, String message) throws ServletException, IOException {
        JSONObject jsnObj = new JSONObject().put("message", message);
        response.getWriter().print(jsnObj.toString());
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_OK);
    }
}
