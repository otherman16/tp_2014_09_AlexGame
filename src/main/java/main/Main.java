package main;

import frontend.*;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

import javax.servlet.Servlet;
import javax.servlet.http.HttpServlet;

/**
 * @author v.chibrikov
 */

public class Main {
    public static void main(String[] args) throws Exception {
        int port = 8080;
        if (args.length == 1) {
            String portString = args[0];
            port = Integer.valueOf(portString);
        }

        AccountService service = new AccountService();

        HttpServlet mainServlet = new MainServlet();
        HttpServlet loginServlet = new LoginServlet(service);
        HttpServlet registrationServlet = new RegistrationServlet(service);

        System.out.append("Starting at port: ").append(String.valueOf(port)).append('\n');

        Server server = new Server(port);
        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.addServlet(new ServletHolder(mainServlet), "/");
        context.addServlet(new ServletHolder(loginServlet), "/api/v1/auth/signin");
        context.addServlet(new ServletHolder(registrationServlet), "/registration");

        ResourceHandler resource_handler = new ResourceHandler();
        resource_handler.setDirectoriesListed(true);
        resource_handler.setResourceBase("public_html");

        HandlerList handlers = new HandlerList();
        handlers.setHandlers(new Handler[]{resource_handler, context});
        server.setHandler(handlers);

        server.start();
        server.join();
    }
}