package websocket;

import base.GameMechanics;
import base.GameUser;
import base.WebSocketService;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.json.JSONObject;

@WebSocket
public class GameWebSocket {
    private String myName;
    private Session session;
    private GameMechanics gameMechanics;
    private WebSocketService webSocketService;

    public GameWebSocket(String myName, GameMechanics gameMechanics, WebSocketService webSocketService) {
        this.myName = myName;
        this.gameMechanics = gameMechanics;
        this.webSocketService = webSocketService;
    }

    @OnWebSocketConnect
    public void onOpen(Session session) {
        setSession(session);
        webSocketService.addSocket(this);
        gameMechanics.addSocket(myName);
    }

    @OnWebSocketClose
    public void onClose(int statusCode, String reason) {
        webSocketService.deleteSocket(this);
    }

    @OnWebSocketMessage
    public void onMessage(String data)  {
        gameMechanics.stepAction(myName, data);
    }

    public String getMyName() {
        return myName;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public void startGame(GameUser user) {
        try {
            JSONObject jsonObj = new JSONObject();
            jsonObj.put("status", "start");
            jsonObj.put("enemyName", user.getEnemyName());
            session.getRemote().sendString(jsonObj.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void gameOver(GameUser user, boolean win) {
        try {
            JSONObject jsonObj = new JSONObject();
            jsonObj.put("status", "finish");
            jsonObj.put("win", win);
            session.getRemote().sendString(jsonObj.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void setMyScore(GameUser user) {
        JSONObject jsonObj = new JSONObject();
        jsonObj.put("status", "increment");
        jsonObj.put("name", myName);
        jsonObj.put("score", user.getMyScore());
        try {
            session.getRemote().sendString(jsonObj.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void setEnemyScore(GameUser user) {
        JSONObject jsonObj = new JSONObject();
        jsonObj.put("status", "increment");
        jsonObj.put("name", user.getEnemyName());
        jsonObj.put("score", user.getEnemyScore());
        try {
            session.getRemote().sendString(jsonObj.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void setMyAction(GameUser user, String data) {
        JSONObject jsonObj = new JSONObject(data);
        try {
            int x = jsonObj.getInt("x");
            int y = jsonObj.getInt("y");
            JSONObject jsonObj1 = new JSONObject();
            jsonObj1.put("status", "step");
            jsonObj1.put("name", user.getEnemyName());
            jsonObj1.put("x", x);
            jsonObj1.put("y", y);
            session.getRemote().sendString(jsonObj1.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }
}
