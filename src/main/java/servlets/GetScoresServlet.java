package servlets;

import account_service.AccountService;
import account_service.UserProfile;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Created by Алексей on 02.10.2014.
 */
public class GetScoresServlet extends HttpServlet {
    private AccountService service;

    public GetScoresServlet(AccountService service) {
        this.service = service;
    }

    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        UserProfile user = service.getUserBySession(request.getSession().toString());
        if ( user==null ) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }
        String[] jsnKeys = {"login","score"};
        JSONObject jsnObj = new JSONObject(user, jsnKeys);
        response.getWriter().println(jsnObj.toString());
        response.setStatus(HttpServletResponse.SC_OK);
    }
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException { response.setStatus(HttpServletResponse.SC_FORBIDDEN); }
}
