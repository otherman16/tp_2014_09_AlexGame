package mechanics;

import backend.MessageIncreaseScore;
import base.GameMechanics;
import base.WebSocketService;
import main.ThreadSettings;
import messageSystem.Abonent;
import messageSystem.Address;
import messageSystem.Message;
import messageSystem.MessageSystem;
import org.json.JSONObject;
import utils.TimeHelper;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class GameMechanicsImpl implements GameMechanics, Abonent {

    private final Address address = new Address();
    private final MessageSystem messageSystem;

    private static final int STEP_TIME = 100;

    private static final int gameTime = 45 * 1000;

    private WebSocketService webSocketService;

    private Map<String, GameSession> gameSessionMap = new HashMap<>();

    private Set<GameSession> allSessions = new HashSet<>();

    private String waiter;

    public GameMechanicsImpl(WebSocketService webSocketService, MessageSystem ms) {
        this.messageSystem = ms;
        messageSystem.addService(this);
        messageSystem.getAddressService().registerGameMechanics(this);
        this.webSocketService = webSocketService;
    }

    public Address getAddress() {
        return address;
    }

    public MessageSystem getMessageSystem() {
        return messageSystem;
    }

    private Puck puck = new Puck();

    @Override
    public void runGameMechanics() {
        while (true) {
            gmStep();
            TimeHelper.sleep(STEP_TIME);
        }
    }

    public void gmStep() {
        for (GameSession session : allSessions) {
            if (session.isActive() && session.getSessionTime() > gameTime) {
                session.closeGameSession();

                Gamer winner = session.isFirstWin() ? session.getFirst() : session.getSecond();

                Message messageIncreaseScore = new MessageIncreaseScore(getAddress(), messageSystem.getAddressService().getAccountServiceAddress(), winner.getEmail(), winner.getScore());
                messageSystem.sendMessage(messageIncreaseScore);

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
        gameSessionMap.put(first, gameSession);
        gameSessionMap.put(second, gameSession);
        webSocketService.notifyStartGame(first, second, 2);
        webSocketService.notifyStartGame(second, first, 1);
    }

    public boolean isFirstWin() {
        for (GameSession session : allSessions) {
            if (session.isFirstWin())
                return true;
        }
        return false;
    }

    @Override
    public void addGamer(String gamerEmail) {
        if (waiter != null && !gamerEmail.equals(waiter)) {
            starGame(gamerEmail);
            waiter = null;
        } else {
            waiter = gamerEmail;
        }
    }

    @Override
    public void enemyStepAction(String gamerEnemyEmail, JSONObject jsonObject) {
        GameSession myGameSession = gameSessionMap.get(gamerEnemyEmail);
        Gamer me = myGameSession.getGamerEnemy(gamerEnemyEmail);
        int code = jsonObject.getInt("code");
        if ( code == 1) {
            puck.setPuck(jsonObject.getDouble("dnextX"), jsonObject.getDouble("dnextY"),
                    jsonObject.getDouble("velocityX"), jsonObject.getDouble("velocityY"),
                    jsonObject.getDouble("speed"), jsonObject.getDouble("angle"));
            webSocketService.notifyEnemyKick(me.getEmail(), puck);
        }
        else if (code == 2 ) {
            double dnextX = jsonObject.getDouble("dnextX");
            double dnextY = jsonObject.getDouble("dnextY");
            webSocketService.notifyEnemyPosition(me.getEmail(), dnextX, dnextY);
        }
        else if (code == 3 ) {
            Gamer myEnemy = myGameSession.getGamer(gamerEnemyEmail);
            me.incrementScore();
            webSocketService.notifyEnemyNewScore(me.getEmail(), myEnemy.getScore());
            webSocketService.notifyMyNewScore(me.getEmail(), me.getScore());
            webSocketService.notifyEnemyNewScore(myEnemy.getEmail(), me.getScore());
            webSocketService.notifyMyNewScore(myEnemy.getEmail(), myEnemy.getScore());
        }
    }

    public void run() {
        while (true){
            messageSystem.execForAbonent(this);
            try {
                Thread.sleep(ThreadSettings.SERVICE_SLEEP_TIME);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}