package base;

import mechanics.Direction;
import mechanics.Puck;
import messageSystem.Abonent;
import websocket.GameWebSocket;

public interface WebSocketService {

    GameWebSocket getExisting(String socketName);

    boolean exists(String gamerEmail);

    void addSocket(GameWebSocket socket);

    void deleteSocket(String socketName);

    void notifyStartGame(String gamerEmail, String gamerEnemyEmail, int number);

    void notifyMyNewScore(String gamerEmail, int myNewScore);

    void notifyEnemyNewScore(String gamerEmail, int enemyNewScore);

    void notifyEnemyPosition(String gamerEmail, Direction direction);

    void notifyMyPosition(String gamerEmail, Direction direction);

    void notifyStartPosition(String gamerEmail, Direction direction);

    void notifyEnemyKick(String gamerEmail, Puck puck);

    void notifyGameOver(String gamerEmail, boolean win);

    void notifyNewEmail(String gamerEmail, String newEmail);

    void notifyToken(String gamerEmail, String token);
}