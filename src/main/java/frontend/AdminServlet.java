package frontend;

import base.UserProfile;
import base.AccountService;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class AdminServlet extends HttpServlet {
    private AccountService service;
    public AdminServlet(AccountService service) {
        this.service = service;
    }
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        UserProfile user = service.getUserBySession(request.getSession());
        if (user != null && user.getLogin().equals("admin")) {
            String timeString = request.getParameter("shutdown");
            if (timeString != null) {
                int timeMS = Integer.valueOf(timeString);
                System.out.print("Server will be down after: " + timeMS + " ms");
                try {
                    Thread.sleep(timeMS);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.print("\nShutdown");
                System.exit(0);
            } else {
                response.setContentType("text/html;charset=utf-8");
                response.getWriter().println("<div>Сервер Epic Game:<br/>Зарегестрированных пользователей: " +
                        service.numberOfRegisteredUsers() + "<br/>Количество пользователей Online: " +
                        service.numberOfAuthUsers() + "<br/>" +
                        "<form action=\"/admin\" method=\"get\">" +
                        "<label for=\"shutdown\">Задайте время остановки сервера в мс</label>" +
                        "<input id=\"shutdown\" name=\"shutdown\" type=\"text\" value=\"1000\"><br/>" +
                        "<input type=\"submit\"></div>");
                response.setStatus(HttpServletResponse.SC_OK);
            }
        }
        else {
            response.sendRedirect("/#");
            response.setStatus(HttpServletResponse.SC_TEMPORARY_REDIRECT);
        }
    }
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    }
}
