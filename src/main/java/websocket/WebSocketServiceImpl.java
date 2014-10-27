package websocket;

import base.WebSocketService;
import org.json.JSONObject;

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

    public void notifyStartGame(String gamerEmail, String gamerEnemyEmail) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "start_game").put("enemy", gamerEnemyEmail);
            socketList.get(gamerEmail).sendRequest(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyStartGame: " + e.getMessage());
        }
    }

    public void notifyMyNewScore(String gamerEmail, int myNewScore) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "set_my_new_score").put("score", myNewScore);
            socketList.get(gamerEmail).sendRequest(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyMyNewScore: " + e.getMessage());
        }
    }

    public void notifyEnemyNewScore(String gamerEmail, int enemyNewScore) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "set_enemy_new_score").put("score", enemyNewScore);
            socketList.get(gamerEmail).sendRequest(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyNewScore: " + e.getMessage());
        }
    }

    public void notifyEnemyStep(String gamerEmail, int x, int y) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "enemy_step").put("x", x).put("y", y);
            socketList.get(gamerEmail).sendRequest(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyStep: " + e.getMessage());
        }
    }

    public void notifyGameOver(String gamerEmail, boolean win) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "game_over").put("win", win);
            socketList.get(gamerEmail).sendRequest(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyGameOver: " + e.getMessage());
        }
    }
}
