package base;

import websocket.GameWebSocket;

/**
 * Created by aleksei on 20.10.14.
 */
public interface WebSocketService {

    public void addUser(GameWebSocket user);

    public void notifyMyNewScore(GameUser user);

    public void notifyEnemyNewScore(GameUser user);

    public void notifyStepAction(GameUser user, String data);

    public void notifyStartGame(GameUser user);

    public void notifyGameOver(GameUser user, boolean win);
}