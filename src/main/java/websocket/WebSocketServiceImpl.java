package websocket;

import base.WebSocketService;
import mechanics.Direction;
import org.json.JSONObject;
import resourse.ResourceFactory;
import resourse.Puck;

import java.util.HashMap;
import java.util.Map;

public class WebSocketServiceImpl implements WebSocketService {

    private Map<String, GameWebSocket> socketList = new HashMap<>();

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
            GameWebSocket current = socketList.get(gamerEmail);
            if (current != null)
                current.sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyStartGame: " + e.getMessage());
        }
    }

    @Override
    public void notifyMyNewScore(String gamerEmail, int myNewScore) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "set_my_new_score").put("score", myNewScore);
            GameWebSocket current = socketList.get(gamerEmail);
            if (current != null)
                current.sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyMyNewScore: " + e.getMessage());
        }
    }

    @Override
    public void notifyEnemyNewScore(String gamerEmail, int enemyNewScore) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "set_enemy_new_score").put("score", enemyNewScore);
            GameWebSocket current = socketList.get(gamerEmail);
            if (current != null)
                current.sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyNewScore: " + e.getMessage());
        }
    }

    @Override
    public void notifyEnemyKick(String gamerEmail, mechanics.Puck puck) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "kick").put("dnextX", puck.getDnextX()).put("dnextY" , puck.getDnextY());
            jsonResponse.put("velocityX" , puck.getVelocityX()).put("velocityY", puck.getVelocityY());
            jsonResponse.put("speed", puck.getSpeed()).put("angle", puck.getAngle());
            GameWebSocket current = socketList.get(gamerEmail);
            if (current != null)
                current.sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyCollision: " + e.getMessage());
        }
    }

    @Override
    public void notifyEnemyPosition(String gamerEmail, Direction direction) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "enemy_position").put("dnextX", direction.getDnextX()).put("dnextY" , direction.getDnextY());
            GameWebSocket current = socketList.get(gamerEmail);
            if (current != null)
                current.sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyPosition: " + e.getMessage());
        }
    }

    @Override
    public void notifyMyPosition(String gamerEmail, Direction direction) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "my_position").put("dnextX", direction.getDnextX()).put("dnextY" , direction.getDnextY());
            GameWebSocket current = socketList.get(gamerEmail);
            if (current != null)
                current.sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyPosition: " + e.getMessage());
        }
    }

    @Override
    public void notifyStartPosition(String gamerEmail, Direction direction) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "start_position").put("dnextX", direction.getDnextX()).put("dnextY" , direction.getDnextY());
            GameWebSocket current = socketList.get(gamerEmail);
            if (current != null)
                current.sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyEnemyPosition: " + e.getMessage());
        }
    }

    @Override
    public void notifyToken(String gamerEmail, String token) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "token").put("token", token);
            GameWebSocket current = socketList.get(gamerEmail);
            if (current != null)
                current.sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyToken: " + e.getMessage());
        }
    }

    @Override
    public void notifyNewEmail(String gamerEmail, String newEmail) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "new_email").put("new_email", newEmail);
            socketList.get(gamerEmail).sendResponse(jsonResponse);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyToken: " + e.getMessage());
        }
    }

    @Override
    public void notifyGameOver(String gamerEmail, boolean win) {
        try {
            JSONObject jsonResponse = new JSONObject();
            jsonResponse.put("code", "game_over").put("win", win);
            GameWebSocket current = socketList.get(gamerEmail);
            if (current != null)
                current.sendResponse(jsonResponse);
            deleteSocket(gamerEmail);
        } catch (Exception e) {
            System.out.println("Exception in WebSocketServiceImpl.notifyGameOver: " + e.getMessage());
        }
    }
}
