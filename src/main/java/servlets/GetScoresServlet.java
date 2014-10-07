package servlets;

import account_service.AccountService;
import account_service.UserProfile;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;

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
        ArrayList<UserProfile> scores = service.getTop10();
        if ( scores==null ) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return;
        }
        String[] jsnKeys = {"login","score"};
        JSONArray jsnArray = new JSONArray();
        for (UserProfile user : scores) {
            jsnArray.put(new JSONObject(user, jsnKeys));
        }
        System.out.println(jsnArray.toString());
        response.getWriter().println(jsnArray.toString());
        response.setStatus(HttpServletResponse.SC_OK);
    }
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException { response.setStatus(HttpServletResponse.SC_FORBIDDEN); }
}
