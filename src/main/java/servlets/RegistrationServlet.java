package servlets;

import account_service.*;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import org.json.*;

/**
 * Created by Алексей on 23.09.2014.
 */
public class RegistrationServlet extends HttpServlet implements Frontend {
    private AccountService service;
    public RegistrationServlet(AccountService service) {
        this.service = service;
    }
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        response.setStatus(HttpServletResponse.SC_TEMPORARY_REDIRECT);
        response.sendRedirect("/#");
    }
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(request.getInputStream()));
        String jsonStr = br.readLine();
        try {
            JSONObject jsonObj = new JSONObject(jsonStr);
            String login = jsonObj.getString("login");
            String email = jsonObj.getString("email");
            String password = jsonObj.getString("password");
            UserProfile user = new UserProfile(login,email,password);
//            if (service.registerUser(user, request.getSession())) {
//                response.setStatus(HttpServletResponse.SC_OK);
//            }
//            else {
//                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
//            }
            if (service.registerUser_DB(user, request.getSession())) {
                response.setStatus(HttpServletResponse.SC_OK);
            }
            else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        } catch (JSONException e) {
            System.out.println(e.getMessage());
        }
    }
}
