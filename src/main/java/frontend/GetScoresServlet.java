package frontend;

import base.AccountServiceError;
import base.AccountServiceResponse;
import base.UserProfile;
import base.AccountService;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;

public class GetScoresServlet extends HttpServlet {
    private AccountService service;
    public GetScoresServlet(AccountService service) {
        this.service = service;
    }
    @Override
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        AccountServiceResponse resp = service.getTop10();
        if ( resp.getStatus() ) {
            success(response, (ArrayList<UserProfile>)resp.getResponse());
        }
        else {
            error(response, (AccountServiceError)resp.getResponse());
        }
    }
    @Override
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException { response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED); }
    private void error(HttpServletResponse response, AccountServiceError error) throws ServletException, IOException {
        JSONObject jsnObj = new JSONObject().put("message", error.getMessage());
        response.getWriter().print(jsnObj.toString());
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }
    private void success(HttpServletResponse response, ArrayList<UserProfile> scores) throws ServletException, IOException {
        JSONArray jsnArray = new JSONArray();
        for (UserProfile user : scores) {
            jsnArray.put(new JSONObject().put("login", user.getLogin()).put("score", user.getScore()));
        }
        response.getWriter().println(jsnArray.toString());
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_OK);
    }
}
