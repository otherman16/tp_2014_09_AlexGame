package servlets;

import account_service.AccountService;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Created by Алексей on 25.09.2014.
 */
public class LogoutServlet extends HttpServlet implements Frontend {
    private AccountService service;
    public LogoutServlet(AccountService service) {
        this.service = service;
    }
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        response.setStatus(HttpServletResponse.SC_TEMPORARY_REDIRECT);
        response.sendRedirect("/#");
    }
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
//        if (service.logoutUser(request.getSession())) {
//            response.setStatus(HttpServletResponse.SC_OK);
//        }
//        else {
//            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
//        }
        if (service.logoutUser_DB(request.getSession())) {
            response.setStatus(HttpServletResponse.SC_OK);
        }
        else {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
