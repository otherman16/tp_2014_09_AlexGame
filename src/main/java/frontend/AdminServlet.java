package frontend;

import base.AccountServiceResponse;
import base.UserProfile;
import base.AccountService;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

import java.util.HashMap;
import java.util.Map;

public class AdminServlet extends HttpServlet {
    private AccountService service;
    public AdminServlet(AccountService service) {
        this.service = service;
    }
    @Override
    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        AccountServiceResponse resp = service.getUserBySession(request.getSession());
        if(resp.getStatus()) {
            UserProfile user = (UserProfile)resp.getResponse();
            if(user.getEmail().equals("admin@admin.ru")) {
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
                    Map<String, Object> pageVariables = new HashMap<>();
                    pageVariables.put("numberOfRegisteredUsers", service.numberOfRegisteredUsers().getResponse());
                    pageVariables.put("numberOfAuthUsers", service.numberOfAuthUsers().getResponse());
                    response.setContentType("text/html;charset=utf-8");
                    response.getWriter().println(PageGenerator.getPage("admin_page.xml", pageVariables));
                    response.setStatus(HttpServletResponse.SC_OK);
                }
            }
            else {
                response.sendRedirect("/#");
                response.setStatus(HttpServletResponse.SC_TEMPORARY_REDIRECT);
            }
        }
        else {
            response.sendRedirect("/#");
            response.setStatus(HttpServletResponse.SC_TEMPORARY_REDIRECT);
        }
    }

    @Override
    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
        response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
    }
}
