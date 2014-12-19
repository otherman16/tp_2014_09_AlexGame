package frontend;

import base.AccountService;
import base.WebSocketService;
import messageSystem.MessageSystem;
import org.eclipse.jetty.websocket.servlet.WebSocketServlet;
import org.eclipse.jetty.websocket.servlet.WebSocketServletFactory;
import websocket.CustomWebSocketCreator;

import javax.servlet.annotation.WebServlet;

@WebServlet(name = "WebSocketGameServlet", urlPatterns = {"/gameSocket"})
public class WebSocketGameServlet extends WebSocketServlet {
    private final static int IDLE_TIME = 60 * 1000;
    private AccountService authService;
    private final MessageSystem messageSystem;
    private WebSocketService webSocketService;

    public WebSocketGameServlet(AccountService authService,
                                WebSocketService webSocketService,
                                MessageSystem ms) {
        this.authService = authService;
        this.webSocketService = webSocketService;
        this.messageSystem = ms;
    }

    @Override
    public void configure(WebSocketServletFactory factory) {
        factory.getPolicy().setIdleTimeout(IDLE_TIME);
        factory.setCreator(new CustomWebSocketCreator(authService,  webSocketService, messageSystem));
    }
}