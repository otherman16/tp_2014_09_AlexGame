package frontend;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import base.AccountService;
import base.AccountServiceResponse;
import base.UserProfile;
import org.json.*;

public class RegistrationServlet extends HttpServlet {
    private AccountService service;
    public RegistrationServlet(AccountService service) {
        this.service = service;
    }
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        response.sendRedirect("/#");
        response.setStatus(HttpServletResponse.SC_TEMPORARY_REDIRECT);
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
            AccountServiceResponse resp = service.registerUser(user, request.getSession());
            if (resp.getStatus()) {
                user = (UserProfile)resp.getResponse();
                JSONObject jsnObj = new JSONObject().put("id", user.getId()).put("email", user.getEmail()).put("login", user.getLogin()).put("score", user.getScore());
                response.getWriter().print(jsnObj.toString());
                response.setContentType("application/json");
                response.setStatus(HttpServletResponse.SC_OK);
            }
            else {
                JSONObject jsnObj = new JSONObject().put("message", resp.getResponse());
                response.getWriter().print(jsnObj.toString());
                response.setContentType("application/json");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        } catch (Exception e) {
            System.out.println("Exception in RegistrationServlet.doPost: " + e.getMessage());
            JSONObject jsnObj = new JSONObject().put("message", "Internal server error");
            response.getWriter().print(jsnObj.toString());
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
