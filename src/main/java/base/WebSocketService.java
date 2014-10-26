package base;

import websocket.GameWebSocket;

public interface WebSocketService {

    public GameWebSocket getExisting(String socketName);

    public boolean exists(String socketName);

    public void addSocket(GameWebSocket socket);

    public void deleteSocket(GameWebSocket socket);

    public void notifyMyNewScore(GameUser user);

    public void notifyEnemyNewScore(GameUser user);

    public void notifyStepAction(GameUser user, String data);

    public void notifyStartGame(GameUser user);

    public void notifyGameOver(GameUser user, boolean win);
}