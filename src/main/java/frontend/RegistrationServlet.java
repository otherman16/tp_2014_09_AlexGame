package frontend;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

import base.AccountService;
import base.AccountServiceError;
import base.AccountServiceResponse;
import base.UserProfile;
import org.json.*;

public class RegistrationServlet extends HttpServlet {
    private AccountService service;
    public RegistrationServlet(AccountService service) {
        this.service = service;
    }
    @Override
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        response.sendRedirect("/#");
        response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
    }
    @Override
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
                success(response, (UserProfile)resp.getResponse());
            }
            else {
                error(response, (AccountServiceError)resp.getResponse());
            }
        } catch (Exception e) {
            System.out.println("Exception in RegistrationServlet.doPost: " + e.getMessage());
            error(response, AccountServiceError.ServerError);
        }
    }
    private void error(HttpServletResponse response, AccountServiceError error) throws ServletException, IOException {
        JSONObject jsnObj = new JSONObject().put("message", error.getMessage());
        response.getWriter().print(jsnObj.toString());
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }
    private void success(HttpServletResponse response, UserProfile user) throws ServletException, IOException {
        JSONObject jsnObj = new JSONObject().put("id", user.getId()).put("email", user.getEmail()).put("login", user.getLogin()).put("score", user.getScore());
        response.getWriter().print(jsnObj.toString());
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_OK);
    }
}