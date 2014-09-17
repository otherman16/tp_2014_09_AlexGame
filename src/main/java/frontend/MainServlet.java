package frontend;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

/**
 * Created by otherman on 15.09.14.
 */
public class MainServlet extends HttpServlet {

    private static final String HTML_DIR = "public_html";

    public void doGet(HttpServletRequest request,
                      HttpServletResponse response) throws ServletException, IOException {
        String email = request.getParameter("email");
        String password = request.getParameter("password");

        response.setStatus(HttpServletResponse.SC_OK);
        FileReader FR = new FileReader("??");
        response.getWriter().println(FR.toString());
    }

    public void doPost(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, IOException {
        response.getWriter().println("Error");
    }

}
