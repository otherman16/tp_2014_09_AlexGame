package frontend;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

import base.AccountService;
import base.AccountServiceResponse;
import base.UserProfile;
import org.json.*;

public class GetUserServlet extends HttpServlet {
    private AccountService service;
    public GetUserServlet(AccountService service) {
        this.service = service;
    }
    @Override
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        AccountServiceResponse resp = service.getUserBySession(request.getSession());
        if (!resp.getStatus()) {
            success(response, new UserProfile("Guest","",""));
        }
        else {
            success(response, (UserProfile)resp.getResponse());
        }
    }
    @Override
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException { response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED); }
    private void success(HttpServletResponse response, UserProfile user) throws ServletException, IOException {
        JSONObject jsnObj = new JSONObject().put("id", user.getId()).put("email", user.getEmail()).put("login", user.getLogin()).put("score", user.getScore());
        response.getWriter().print(jsnObj.toString());
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_OK);
    }
}
