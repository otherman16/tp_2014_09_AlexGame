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
        JSONObject jsnObj;
        response.setContentType("application/json");
        if (resp.getStatus()) {
            jsnObj = new JSONObject().put("message", resp.getResponse());
            response.setStatus(HttpServletResponse.SC_OK);
        }
        else {
            AccountServiceError error = (AccountServiceError)resp.getResponse();
            jsnObj = new JSONObject().put("message", error.getMessage());
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
        response.getWriter().print(jsnObj.toString());
    }
}
