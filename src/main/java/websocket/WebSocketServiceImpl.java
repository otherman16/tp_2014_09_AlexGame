package websocket;

import base.GameUser;
import base.Gamer;
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

    public boolean exists(String gamerEmail) {
        return socketList.containsKey(gamerEmail);
    }

    public void addSocket(GameWebSocket socket) {
        socketList.put(socket.getMyName(), socket);
    }

    public void deleteSocket(GameWebSocket socket) {
        socketList.remove(socket.getMyName());
    }

    public void notifyMyNewScore(String gamerEmail) {
        socketList.get(gamerEmail).setMyScore();
    }

    public void notifyEnemyNewScore(String gamerEmail, String gamerEnemyEmail) {
        socketList.get(gamerEmail).setEnemyScore(socketList.get(gamerEnemyEmail).getGamer());
    }

    public void notifyStepAction(String gamerEmail, String gamerEnemyEmail, String data) {
        socketList.get(gamerEmail).setEnemyAction(gamerEnemyEmail, data);
    }

    public void notifyStartGame(String gamerEmail, String gamerEnemyEmail) {
        GameWebSocket gameWebSocket = socketList.get(gamerEmail);
        gameWebSocket.startGame(socketList.get(gamerEnemyEmail).getGamer());
    }

    public void notifyGameOver(String gamerEmail, String gamerEnemyEmail) {
        Gamer me = socketList.get(gamerEmail).getGamer();
        Gamer enemy = socketList.get(gamerEnemyEmail).getGamer();
        socketList.get(gamerEmail).gameOver(me.getScore() > enemy.getScore());
    }
}
