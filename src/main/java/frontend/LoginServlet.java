package frontend;

import base.AccountService;
import base.AccountServiceError;
import base.AccountServiceResponse;
import base.UserProfile;
import org.json.JSONException;
import org.json.JSONObject;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

public class LoginServlet extends HttpServlet {
    private AccountService service;
    public LoginServlet(AccountService service) {
        this.service = service;
    }
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        response.sendRedirect("/#");
        response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
    }
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
        InputStream tmp = request.getInputStream();
        BufferedReader br = new BufferedReader(new InputStreamReader(tmp));
        String jsonStr =br.readLine();
        //System.out.append(jsonStr);
        try {
            JSONObject jsonObj = new JSONObject(jsonStr);
            String email = jsonObj.getString("email");
            String password = jsonObj.getString("password");

            //String email = request.getParameter("email");
            //String password = request.getParameter("password");
            UserProfile user = new UserProfile("", email, password);
            AccountServiceResponse resp = service.authUser(user, request.getSession());
            if (resp.getStatus()) {
                user = (UserProfile) resp.getResponse();
                JSONObject jsnObj = new JSONObject().put("id", user.getId()).put("email", user.getEmail()).put("login", user.getLogin()).put("score", user.getScore());
                response.getWriter().print(jsnObj.toString());
                response.setContentType("application/json");
                response.setStatus(HttpServletResponse.SC_OK);
            } else {
                AccountServiceError error = (AccountServiceError) resp.getResponse();
                JSONObject jsnObj = new JSONObject().put("message", error.getMessage());
                System.out.append(jsnObj.toString());
                response.getWriter().print(jsnObj.toString());
                response.setContentType("application/json");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
        }
        catch (Exception e) {
            System.out.println("Exception in LoginServlet.doPost: " + e.getMessage());
            JSONObject jsnObj = new JSONObject().put("message", "Internal server error");
            response.getWriter().print(jsnObj.toString());
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
