package websocket;

import base.AccountService;
import base.GameMechanics;
import base.WebSocketService;
import org.eclipse.jetty.websocket.servlet.ServletUpgradeRequest;
import org.eclipse.jetty.websocket.servlet.ServletUpgradeResponse;
import org.eclipse.jetty.websocket.servlet.WebSocketCreator;
import websocket.GameWebSocket;

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
        // по сессии получаем email пользователя
        String name = authService.getUserBySession(sessionId).getLogin();
        //System.out.append("createWebSocket\n");
        //System.out.append(name);
        return new GameWebSocket(name, gameMechanics, webSocketService);
    }
}
