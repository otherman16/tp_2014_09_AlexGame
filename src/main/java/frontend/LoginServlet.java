package frontend;

import templater.PageGenerator;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by otherman on 15.09.14.
 */
public class LoginServlet extends HttpServlet {

    private AccountService service;

    public LoginServlet(AccountService service) {
        this.service = service;
    }

    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        response.getWriter().println("Error");
    }

    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
        String email = request.getParameter("email");
        String password = request.getParameter("password");

        UserProfile user = new UserProfile(null,email,password);

        if (service.authUser(user, request.getSession())) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.sendRedirect("/");
        }
        else {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.sendRedirect("/");
        }
    }

}
