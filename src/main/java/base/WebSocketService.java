package base;

import websocket.GameWebSocket;

public interface WebSocketService {

    GameWebSocket getExisting(String socketName);

    boolean exists(String gamerEmail);

    void addSocket(GameWebSocket socket);

    void deleteSocket(String socketName);

    void notifyStartGame(String gamerEmail, String gamerEnemyEmail, int number);

    void notifyMyNewScore(String gamerEmail, int myNewScore);

    void notifyEnemyNewScore(String gamerEmail, int enemyNewScore);

    void notifyEnemyStep(String gamerEmail, int direction);

    void notifyEnemyPosition(String gamerEmail, double dnextX, double dnextY);

    void notifyEnemyKick(String gamerEmail, double dnextX, double dnextY, double velocityX,
                                     double velocityY, double speed, double angle);

    void notifyGameOver(String gamerEmail, boolean win);
}