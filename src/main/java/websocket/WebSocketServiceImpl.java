package websocket;

import base.GameUser;
import base.WebSocketService;

import java.util.HashMap;

public class WebSocketServiceImpl implements WebSocketService {
    private HashMap<String, GameWebSocket> socketList = new HashMap<>();

    public GameWebSocket getExisting(String socketName) {
        if (exists(socketName)) {
            return socketList.get(socketName);
        }
        else {
            return null;
        }
    }

    public boolean exists(String socketName) {
        return socketList.containsKey(socketName);
    }

    public void addSocket(GameWebSocket socket) {
        socketList.put(socket.getMyName(), socket);
    }

    public void deleteSocket(GameWebSocket socket) {
        socketList.remove(socket.getMyName());
    }

    public void notifyMyNewScore(GameUser user) {
        socketList.get(user.getMyName()).setMyScore(user);
    }

    public void notifyEnemyNewScore(GameUser user) {
        socketList.get(user.getMyName()).setEnemyScore(user);
    }

    public void notifyStepAction(GameUser user, String data) {
        socketList.get(user.getMyName()).setMyAction(user, data);
    }

    public void notifyStartGame(GameUser user) {
        GameWebSocket gameWebSocket = socketList.get(user.getMyName());
        gameWebSocket.startGame(user);
    }

    public void notifyGameOver(GameUser user, boolean win) {
        socketList.get(user.getMyName()).gameOver(user, win);
    }
}
