package frontend;


import base.GameUser;
import base.WebSocketService;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;

import java.util.HashMap;
import java.util.Map;

public class WebSocketServiceImpl implements WebSocketService {
    private Map<String, GameWebSocket> userSockets = new HashMap<>();

    public void addUser(GameWebSocket user) {
        System.out.append("\nAdd user ").append(user.getMyName()).append(" ").append(user.toString()).append(" in userSocket\n");
        userSockets.put(user.getMyName(), user);
    }

    public void notifyMyNewScore(GameUser user) {
        userSockets.get(user.getMyName()).setMyScore(user);
    }

    public void notifyEnemyNewScore(GameUser user) {
        userSockets.get(user.getMyName()).setEnemyScore(user);
    }

    public void notifyStepAction(GameUser user, String data) {
        userSockets.get(user.getMyName()).setMyAction(user, data);
    }

    public void notifyStartGame(GameUser user) {
        GameWebSocket gameWebSocket = userSockets.get(user.getMyName());
        gameWebSocket.startGame(user);
    }

    public void notifyGameOver(GameUser user, boolean win) {
        userSockets.get(user.getMyName()).gameOver(user, win);
    }
}
