package websocket;

import base.GameMechanics;
import base.GameUser;
import base.WebSocketService;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.json.simple.JSONObject;

@WebSocket
public class GameWebSocket {
    private String myName;
    private Session session;
    private GameMechanics gameMechanics;
    private WebSocketService webSocketService;

    public GameWebSocket(String myName, GameMechanics gameMechanics, WebSocketService webSocketService) {
        System.out.append("in GameWebSock\n");
        this.myName = myName;
        this.gameMechanics = gameMechanics;
        this.webSocketService = webSocketService;
    }

    public String getMyName() {
        System.out.append("getMyname").append(myName).append("\n");
        return myName;
    }

    public void startGame(GameUser user) {
        try {
            JSONObject jsonStart = new JSONObject();
            jsonStart.put("status", "start");
            jsonStart.put("enemyName", user.getEnemyName());
            System.out.append("Start_game\n");
            session.getRemote().sendString(jsonStart.toJSONString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void gameOver(GameUser user, boolean win) {
        try {
            System.out.append("Game_over\n");
            JSONObject jsonStart = new JSONObject();
            jsonStart.put("status", "finish");
            jsonStart.put("win", win);
            session.getRemote().sendString(jsonStart.toJSONString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    @OnWebSocketMessage
    public void onMessage(String data)  {
        System.out.append("onMessage\n" + data + "\n");
        gameMechanics.stepAction(myName, data);
    }

    // если убрать аннотацию, то не работает.
    @OnWebSocketConnect
    public void onOpen(Session session) {
        System.out.append("onOpen\n");
        setSession(session);
        webSocketService.addUser(this);
        gameMechanics.addUser(myName);
    }

    public void setMyScore(GameUser user) {
        JSONObject jsonStart = new JSONObject();
        jsonStart.put("status", "increment");
        jsonStart.put("name", myName);
        jsonStart.put("score", user.getMyScore());
        System.out.append("setMyScore\n");
        try {
            session.getRemote().sendString(jsonStart.toJSONString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void setEnemyScore(GameUser user) {
        JSONObject jsonStart = new JSONObject();
        jsonStart.put("status", "increment");
        jsonStart.put("name", user.getEnemyName());
        jsonStart.put("score", user.getEnemyScore());
        System.out.append("SetEnemyScore\n");
        try {
            session.getRemote().sendString(jsonStart.toJSONString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public void setMyAction(GameUser user, String data) { // здесь должна быть data, чтоб передать сопернику координату
        org.json.JSONObject jsonObj = new org.json.JSONObject(data);
        // получаем пришедшие координаты
        int x = jsonObj.getInt("x");
        int y = jsonObj.getInt("y");
        JSONObject jsonStart = new JSONObject();
        jsonStart.put("status", "step");
        jsonStart.put("name", user.getEnemyName());
        jsonStart.put("x", x); // устанавливаем x и y координаты точки хода соперника.
        jsonStart.put("y", y);
        System.out.append("SetEnemyAction\n");
        // отправляем их сопернику.
        try {
            session.getRemote().sendString(jsonStart.toJSONString());
        } catch (Exception e) {
            System.out.print(e.toString());
        }
    }

    public Session getSession() {
        System.out.append("getSession\n");
        return session;
    }

    public void setSession(Session session) {
        System.out.append("setSession\n");
        this.session = session;
    }

    @OnWebSocketClose
    public void onClose(int statusCode, String reason) {
        System.out.append("Close websocket\n");
    }
}
