package main;

import backend.AccountServiceImpl;
import base.AccountService;
import base.GameMechanics;
import base.WebSocketService;
import frontend.*;
import mechanics.GameMechanicsImpl;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import javax.servlet.http.HttpServlet;
import resourse.ReadXMLFileSAX;
import resourse.SerializationObject;
import websocket.WebSocketServiceImpl;

public class Main {
    public static void main(String[] args) throws Exception {

        SerializationObject P_startServer = (SerializationObject) ReadXMLFileSAX.readXML("P_startServer.xml");
        if (P_startServer == null) {
            System.out.append("Read xml Error");
        }

        Integer port = P_startServer.getPort();
        System.out.append("Starting at port: ").append(port.toString()).append('\n');

        AccountService service = new AccountServiceImpl();
        WebSocketService webSocketService = new WebSocketServiceImpl();
        GameMechanics gameMechanics = new GameMechanicsImpl(webSocketService);

        HttpServlet loginServlet = new LoginServlet(service);
        HttpServlet registrationServlet = new RegistrationServlet(service);
        HttpServlet getUserServlet = new GetUserServlet(service);
        HttpServlet logoutUserServlet = new LogoutServlet(service);
        HttpServlet adminServlet = new AdminServlet(service);
        HttpServlet getScoreServlet = new GetScoresServlet(service);
        HttpServlet webSocketGameServlet = new WebSocketGameServlet(service, gameMechanics, webSocketService);

        Server server = new Server(port);
        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.addServlet(new ServletHolder(getScoreServlet), "/get_scores");
        context.addServlet(new ServletHolder(getUserServlet), "/get_user");
        context.addServlet(new ServletHolder(logoutUserServlet), "/logout");
        context.addServlet(new ServletHolder(adminServlet), "/admin");
        context.addServlet(new ServletHolder(loginServlet), "/login");
        context.addServlet(new ServletHolder(registrationServlet), "/registration");
        context.addServlet(new ServletHolder(webSocketGameServlet), "/gameSocket");
        ResourceHandler resource_handler = new ResourceHandler();
        resource_handler.setDirectoriesListed(true);
        resource_handler.setResourceBase("public_html");
        HandlerList handlers = new HandlerList();
        handlers.setHandlers(new Handler[]{resource_handler, context});

        server.setHandler(handlers);

        server.start();
        gameMechanics.run();
        server.join();
    }
}
