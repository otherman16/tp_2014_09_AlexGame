package mechanics;

import base.GameMechanics;
import base.WebSocketService;
import utils.TimeHelper;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;


public class GameMechanicsImpl implements GameMechanics {
    private static final int STEP_TIME = 100;

    private static final int gameTime = 15 * 1000;

    private WebSocketService webSocketService;

    private Map<String, GameSession> gameSessionList = new HashMap<>();

    private Set<GameSession> allSessions = new HashSet<>();

    private String waiter;

    public GameMechanicsImpl(WebSocketService webSocketService) {
        this.webSocketService = webSocketService;
    }

    @Override
    public void run() {
        while (true) {
            gmStep();
            TimeHelper.sleep(STEP_TIME);
        }
    }

    private void gmStep() {
        for (GameSession session : allSessions) {
            if (session.isActive() && session.getSessionTime() > gameTime) {
                session.closeGameSession();
                boolean firstWin = session.isFirstWin();
                webSocketService.notifyGameOver(session.getFirst().getEmail(), firstWin);
                webSocketService.notifyGameOver(session.getSecond().getEmail(), !firstWin);
            }
        }
    }

    private void starGame(String first) {
        String second = waiter;
        GameSession gameSession = new GameSession(first, second);
        allSessions.add(gameSession);
        gameSessionList.put(first, gameSession);
        gameSessionList.put(second, gameSession);

        webSocketService.notifyStartGame(first, second);
        webSocketService.notifyStartGame(second, first);
    }

    public void addGamer(String gamerEmail) {
        if (waiter != null && !gamerEmail.equals(waiter)) {
            starGame(gamerEmail);
            waiter = null;
        } else {
            waiter = gamerEmail;
        }
    }

    public void enemyStepAction(String gamerEnemyEmail, int x, int y) {
        GameSession myGameSession = gameSessionList.get(gamerEnemyEmail);
        Gamer me = myGameSession.getGamerEnemy(gamerEnemyEmail);
        Gamer myEnemy = myGameSession.getGamer(gamerEnemyEmail);
        myEnemy.incrementScore();
        webSocketService.notifyEnemyStep(me.getEmail(), x, y);
        webSocketService.notifyEnemyNewScore(me.getEmail(), myEnemy.getScore());
    }
}