package websocket;

import base.*;
import org.eclipse.jetty.websocket.servlet.ServletUpgradeRequest;
import org.eclipse.jetty.websocket.servlet.ServletUpgradeResponse;
import org.eclipse.jetty.websocket.servlet.WebSocketCreator;

import javax.servlet.http.HttpSession;

public class CustomWebSocketCreator implements WebSocketCreator {
    private AccountService authService;
    private GameMechanics gameMechanics;
    private WebSocketService webSocketService;

    public CustomWebSocketCreator(AccountService authService,
                                  GameMechanics gameMechanics,
                                  WebSocketService webSocketService) {
        this.authService = authService;
        this.gameMechanics = gameMechanics;
        this.webSocketService = webSocketService;
    }

    @Override
    public Object createWebSocket(ServletUpgradeRequest req, ServletUpgradeResponse resp) {
        HttpSession sessionId = req.getHttpServletRequest().getSession();
        AccountServiceResponse response = authService.getUserBySession(sessionId);
        UserProfile user;
        if (!response.getStatus()) {
            user = new UserProfile("Guest","","");
        }
        else {
            user = (UserProfile)response.getResponse();
        }
        String name = user.getEmail();
        return new GameWebSocket(name, gameMechanics, webSocketService);
    }
}
