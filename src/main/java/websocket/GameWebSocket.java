package websocket;

import base.GameMechanics;
import base.GameUser;
import base.Gamer;
import base.WebSocketService;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.json.JSONObject;

@WebSocket
public class GameWebSocket {
    private String gamerEmail;
    private Gamer gamer;
    private Session session;
    private GameMechanics gameMechanics;
    private WebSocketService webSocketService;

    public GameWebSocket(String gamerEmail, GameMechanics gameMechanics, WebSocketService webSocketService) {
        this.gamerEmail = gamerEmail;
        this.gamer = new Gamer(gamerEmail);
        this.gameMechanics = gameMechanics;
        this.webSocketService = webSocketService;
    }

    @OnWebSocketConnect
    public void onOpen(Session session) {
        setSession(session);
        webSocketService.addSocket(this);
        gameMechanics.addUser(gamerEmail);
    }

    @OnWebSocketClose
    public void onClose(int statusCode, String reason) {
        webSocketService.deleteSocket(this);
    }

    @OnWebSocketMessage
    public void onMessage(String data)  {
        gameMechanics.stepAction(gamerEmail, data);
    }

    public String getMyName() {
        return gamerEmail;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public Gamer getGamer() {
        return gamer;
    }

    public void startGame(Gamer gamerEnemy) {
        try {
            JSONObject jsonObj = new JSONObject();
            jsonObj.put("status", "start");
            jsonObj.put("enemyEmail", gamerEnemy.getEmail());
            session.getRemote().sendString(jsonObj.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void gameOver(boolean win) {
        try {
            JSONObject jsonObj = new JSONObject();
            jsonObj.put("status", "finish");
            jsonObj.put("win", win);
            session.getRemote().sendString(jsonObj.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void setMyScore() {
        JSONObject jsonObj = new JSONObject();
        jsonObj.put("status", "increment");
        jsonObj.put("myEmail", gamer.getEmail());
        jsonObj.put("myScore", gamer.getScore());
        try {
            session.getRemote().sendString(jsonObj.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void setEnemyScore(Gamer gamerEnemy) {
        JSONObject jsonObj = new JSONObject();
        jsonObj.put("status", "increment");
        jsonObj.put("enemyEmail", gamerEnemy.getEmail());
        jsonObj.put("enemyScore", gamerEnemy.getScore());
        try {
            session.getRemote().sendString(jsonObj.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void setMyAction(String gamerEnemyEmail, String data) {
        JSONObject jsonObj = new JSONObject(data);
        try {
            int x = jsonObj.getInt("x");
            int y = jsonObj.getInt("y");
            JSONObject jsonObj1 = new JSONObject();
            jsonObj1.put("status", "step");
            jsonObj1.put("enemyEmail", gamerEnemyEmail);
            jsonObj1.put("x", x);
            jsonObj1.put("y", y);
            session.getRemote().sendString(jsonObj1.toString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }
}
