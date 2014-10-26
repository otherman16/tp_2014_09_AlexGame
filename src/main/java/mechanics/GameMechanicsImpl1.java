package mechanics;

import base.GameMechanics;
import base.Gamer;
import base.WebSocketService;
import utils.TimeHelper;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class GameMechanicsImpl1 implements GameMechanics {
    private static final int STEP_TIME = 100;

    private static final int gameTime = 15 * 1000;

    private WebSocketService webSocketService;

    private Map<String, GameSession1> gameSessionList = new HashMap<>();

    private Set<GameSession1> allSessions = new HashSet<>();

    private String waiter;

    public GameMechanicsImpl1(WebSocketService webSocketService) {
        this.webSocketService = webSocketService;
    }

    public void addUser(String userEmail) {
        if (waiter != null && !userEmail.equals(waiter)) {
            starGame(userEmail);
            waiter = null;
        } else {
            waiter = userEmail;
        }
    }

    private void starGame(String first) {
        String second = waiter;
        GameSession1 newGameSession = new GameSession1(first, second);
        allSessions.add(newGameSession);
        gameSessionList.put(first, newGameSession);
        gameSessionList.put(second, newGameSession);

        webSocketService.notifyStartGame(newGameSession.getGamer(first));
        webSocketService.notifyStartGame(newGameSession.getGamer(second));
    }

    public void stepAction (String gamerEmail, String data) {
        GameSession1 myGameSession = gameSessionList.get(gamerEmail);
        Gamer gamer = myGameSession.getGamer(gamerEmail);
        gamer.incrementScore();
        Gamer gamerEnemy = myGameSession.getGamerEnemy(gamerEmail);
        gamerEnemy.incrementScore();
        // совершаем действие - отрисовываем на экране соперника действие, совершенное первым лицом
        webSocketService.notifyStepAction(gamerEnemy, data);

        webSocketService.notifyMyNewScore(gamer);
        webSocketService.notifyEnemyNewScore(gamerEnemy);
    }

    @Override
    public void run() {
        while (true) {
            gmStep();
            TimeHelper.sleep(STEP_TIME);
        }
    }

    private void gmStep() {
        for (GameSession1 session : allSessions) {
            if (session.isActive() && session.getSessionTime() > gameTime) {
                session.closeGameSession();
                webSocketService.notifyGameOver(session.getGamer1(), session.getGamer1().getScore() > session.getGamer2().getScore());
                webSocketService.notifyGameOver(session.getGamer2(), session.getGamer2().getScore() > session.getGamer1().getScore());
            }
        }
    }
}
