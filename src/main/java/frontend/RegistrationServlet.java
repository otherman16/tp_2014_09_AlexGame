package frontend;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import org.json.*;

/**
 * Created by otherman on 15.09.14.
 */
public class RegistrationServlet extends HttpServlet {

    private AccountService service;

    public RegistrationServlet(AccountService service) {
        this.service = service;
    }

    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        response.getWriter().println("Error");
    }

    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(request.getInputStream()));
        String jsonStr = "";
        if(br != null){
            jsonStr = br.readLine();
        }

        JSONObject jsonObj = null;
        try {
            jsonObj = new JSONObject(jsonStr);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        String login = null;
        try {
            login = jsonObj.getString("login");
        } catch( JSONException e) {
            e.printStackTrace();
        }
        String email = null;
        try {
            email = jsonObj.getString("email");
        } catch( JSONException e) {
            e.printStackTrace();
        }
        String password = null;
        try {
            password = jsonObj.getString("password");
        } catch( JSONException e) {
            e.printStackTrace();
        }

        UserProfile user = new UserProfile(login,email,password);


        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        if (service.registerUser(user, request.getSession())) {
            response.setStatus(HttpServletResponse.SC_OK);
        }
        else {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

}
