package websocket;

import base.*;
import messageSystem.MessageSystem;
import org.eclipse.jetty.websocket.servlet.ServletUpgradeRequest;
import org.eclipse.jetty.websocket.servlet.ServletUpgradeResponse;
import org.eclipse.jetty.websocket.servlet.WebSocketCreator;

import javax.servlet.http.HttpSession;

public class CustomWebSocketCreator implements WebSocketCreator {
    private final MessageSystem messageSystem;
    private AccountService authService;
    private WebSocketService webSocketService;

    public CustomWebSocketCreator(AccountService authService,
                                  WebSocketService webSocketService,
                                  MessageSystem ms) {
        this.authService = authService;
        this.webSocketService = webSocketService;
        this.messageSystem = ms;
    }

    @Override
    public Object createWebSocket(ServletUpgradeRequest req, ServletUpgradeResponse resp) {
        HttpSession sessionId = req.getHttpServletRequest().getSession();
        AccountServiceResponse response = authService.getUserBySession(sessionId);
        UserProfile user;
        if (!response.getStatus()) {
            user = new UserProfile("Guest","Guest@Guest.ru","Guest");
        }
        else {
            user = (UserProfile)response.getResponse();
        }
        String gamerEmail = user.getEmail();
        if (!webSocketService.exists(gamerEmail)) {
            return new GameWebSocket(gamerEmail, webSocketService, messageSystem);
        }
        else {
            return webSocketService.getExisting(gamerEmail);
        }
    }
}
