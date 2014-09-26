package servlets;

import account_service.*;
import org.json.JSONException;
import org.json.JSONObject;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * Created by Алексей on 23.09.2014.
 */
public class LoginServlet extends HttpServlet {
    private AccountService service;
    public LoginServlet(AccountService service) {
        this.service = service;
    }
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    }
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(request.getInputStream()));
        String jsonStr = "";
        jsonStr = br.readLine();
        JSONObject jsonObj = null;
        try {
            jsonObj = new JSONObject(jsonStr);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        String email = "";
        String password = "";
        try {
            email = jsonObj.getString("email");
            password = jsonObj.getString("password");
        } catch( JSONException e) {
            e.printStackTrace();
        }
        UserProfile user = new UserProfile("",email,password);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        if (service.authUser(user, request.getSession())) {
            response.setStatus(HttpServletResponse.SC_OK);
        }
        else {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
