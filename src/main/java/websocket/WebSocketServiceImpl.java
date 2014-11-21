package websocket;

import base.WebSocketService;
import org.json.JSONObject;
import resourse.ResourceFactory;
import resourse.Puck;
import resourse.StartPort;

import java.util.HashMap;

public class WebSocketServiceImpl implements WebSocketService {

    private HashMap<String, GameWebSocket> socketList = new HashMap<>();

    @Override
    public GameWebSocket getExisting(String socketName) {
        if (exists(socketName)) {
            return socketList.get(socketName);
        }
        else {
            return null;
        }
    }

    @Override
    public boolean exists(String gamerEmail) {
        return socketList.containsKey(gamerEmail);
    }

    @Override
    public void addSocket(GameWebSocket socket) {
        socketList.put(socket.getMyName(), socket);
    }

    @Override
    public void deleteSocket(String socketName) {
        socketList.remove(socketName);
    }

    @Override
    public void notifyStartGame(String gamerEmail, String gamerEnemyEmail, int number) {
        try {
            JSONObject jsonResponse = new JSONObject();
            Puck puck = (Puck)ResourceFactory.instance().get("./data/puck.xml");
            jsonResponse.put("code", "start_game").put("enemyEmail", gamerEnemyEmail).put("number", number).put("speed", puck.getSpeed());
            socketList.get(gamerEmail).sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyStartGame: " + e.getMessage());
        }
    }

    @Override
    public void notifyMyNewScore(String gamerEmail, int myNewScore) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "set_my_new_score").put("score", myNewScore);
            socketList.get(gamerEmail).sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyMyNewScore: " + e.getMessage());
        }
    }

    @Override
    public void notifyEnemyNewScore(String gamerEmail, int enemyNewScore) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "set_enemy_new_score").put("score", enemyNewScore);
            socketList.get(gamerEmail).sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyNewScore: " + e.getMessage());
        }
    }

    @Override
    public void notifyEnemyStep(String gamerEmail, int direction) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "enemy_step").put("direction", direction);
            socketList.get(gamerEmail).sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyStep: " + e.getMessage());
        }
    }

    @Override
    public void notifyEnemyKick(String gamerEmail, double dnextX, double dnextY, double velocityX,
                                     double velocityY, double speed, double angle) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "kick").put("dnextX", dnextX).put("dnextY" , dnextY);
            jsonResponse.put("velocityX" , velocityX).put("velocityY", velocityY);
            jsonResponse.put("speed", speed).put("angle", angle);
            socketList.get(gamerEmail).sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyCollision: " + e.getMessage());
        }
    }

    @Override
    public void notifyEnemyPosition(String gamerEmail, double dnextX, double dnextY) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "enemy_position").put("dnextX", dnextX).put("dnextY" , dnextY);
            socketList.get(gamerEmail).sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyPosition: " + e.getMessage());
        }
    }

    @Override
    public void notifyGameOver(String gamerEmail, boolean win) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "game_over").put("win", win);
            socketList.get(gamerEmail).sendResponse(jsonResponse);
            deleteSocket(gamerEmail);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyGameOver: " + e.getMessage());
        }
    }
}
