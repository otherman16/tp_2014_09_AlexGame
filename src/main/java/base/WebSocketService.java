package base;

import websocket.GameWebSocket;

public interface WebSocketService {

    public GameWebSocket getExisting(String socketName);

    public boolean exists(String gamerEmail);

    public void addSocket(GameWebSocket socket);

    public void deleteSocket(GameWebSocket socket);

    public void notifyMyNewScore(String gamerEmail);

    public void notifyEnemyNewScore(String gamerEmail, String gamerEnemyEmail);

    public void notifyStepAction(String gamerEmail, String data);

    public void notifyStartGame(String gamerEmail, String gamerEnemyEmail);

    public void notifyGameOver(String gamerEmail, String gamerEnemyEmail);
}