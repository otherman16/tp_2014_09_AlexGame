package frontend;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

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
        String login = request.getParameter("login");
        String email = request.getParameter("email");
        String password = request.getParameter("password");

        UserProfile user = new UserProfile(login,email,password);


        if (service.registerUser(user, request.getSession())) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.sendRedirect("/");
        }
        else {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.sendRedirect("/");
        }
    }

}
