package servlets;

import account_service.*;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import jdk.nashorn.internal.parser.JSONParser;
import org.json.*;

/**
 * Created by Алексей on 23.09.2014.
 */
public class RegistrationServlet extends HttpServlet {
    private AccountService service;
    public RegistrationServlet(AccountService service) {
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
        String login = "";
        String email = "";
        String password = "";
        try {
            login = jsonObj.getString("login");
            email = jsonObj.getString("email");
            password = jsonObj.getString("password");
        } catch( JSONException e) {
            e.printStackTrace();
        }
        UserProfile user = new UserProfile(login,email,password);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        if (service.registerUser(user, request.getSession())) {
            response.setStatus(HttpServletResponse.SC_ACCEPTED);
        }
        else {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
