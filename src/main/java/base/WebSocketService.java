package base;

import websocket.GameWebSocket;

public interface WebSocketService {

    public GameWebSocket getExisting(String socketName);

    public boolean exists(String gamerEmail);

    public void addSocket(GameWebSocket socket);

    public void deleteSocket(String socketName);

    public void notifyStartGame(String gamerEmail, String gamerEnemyEmail, int number);

    public void notifyMyNewScore(String gamerEmail, int myNewScore);

    public void notifyEnemyNewScore(String gamerEmail, int enemyNewScore);

    public void notifyEnemyStep(String gamerEmail, int direction);

    public void notifyGameOver(String gamerEmail, boolean win);
}