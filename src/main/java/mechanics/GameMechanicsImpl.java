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

import java.util.*;

public class GameMechanicsImpl implements GameMechanics, Abonent {

    private final Address address = new Address();
    private final MessageSystem messageSystem;

    private static final int STEP_TIME = 100;

    private static final int gameTime = 45 * 1000;

    private WebSocketService webSocketService;

    private Map<String, GameSession> gameSessionMap = new HashMap<>();

    private Set<GameSession> allSessions = new HashSet<>();

    private Map<String, String> tokenMap = new HashMap<>();

    private String waiter;

    private void generateToken (String email) {
        boolean success = false;
        while ( !success ) {
            char[] chars = "abcde123456789".toCharArray();
            StringBuilder sb = new StringBuilder();
            Random random = new Random();
            for (int i = 0; i < 4; i++) {
                char c = chars[random.nextInt(chars.length)];
                sb.append(c);
            }
            String output = sb.toString();
            System.out.println(output);
            if ( tokenMap.get(output) == null ) {
                tokenMap.put(output, email);
                success = true;
                webSocketService.notifyToken(email, output);
            }
        }
    }

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
    private Direction direction = new Direction();

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
    public void addGamerOrJoystick(String gamerEmail) {
        if ( gamerEmail.equals("Guest@Guest.ru") ) {
            System.out.println("This is joystick");
        } else if ( waiter != null && !gamerEmail.equals(waiter) ){
            generateToken(gamerEmail);
            starGame(gamerEmail);
            waiter = null;
        } else {
            generateToken(gamerEmail);
            waiter = gamerEmail;
        }
    }

    @Override
    public void StepAction(String gamerEnemyEmail, JSONObject jsonObject) {
        //System.out.println("new action");
        int code = jsonObject.getInt("code");
        if ( code == 0 ) {
            String email = jsonObject.getString("email");
            direction.setDirection(jsonObject);
            webSocketService.notifyMyPosition(email, direction);
            //GameSession myGameSession = gameSessionMap.get(jsonObject.getString("email"));
            //Gamer enemy = myGameSession.getGamerEnemy(gamerEnemyEmail);
            //direction.inverse();
            //webSocketService.notifyEnemyPosition(enemy.getEmail(), direction);
        } else if ( code == -1 ) {
            String token = jsonObject.getString("token");
            String newEmail = tokenMap.get(token);
            webSocketService.notifyNewEmail(gamerEnemyEmail, newEmail);
        }
        else {
            GameSession myGameSession = gameSessionMap.get(gamerEnemyEmail);
            Gamer me = myGameSession.getGamerEnemy(gamerEnemyEmail);
            if (code == 1) {
                puck.setPuck(jsonObject);
                webSocketService.notifyEnemyKick(me.getEmail(), puck);
            } else if (code == 2) {
                //System.out.println("code 2");
                direction.setDirection(jsonObject);
                webSocketService.notifyEnemyPosition(me.getEmail(), direction);
            } else if (code == 3) {
                Gamer myEnemy = myGameSession.getGamer(gamerEnemyEmail);
                me.incrementScore();
                webSocketService.notifyEnemyNewScore(me.getEmail(), myEnemy.getScore());
                webSocketService.notifyMyNewScore(me.getEmail(), me.getScore());
                webSocketService.notifyEnemyNewScore(myEnemy.getEmail(), me.getScore());
                webSocketService.notifyMyNewScore(myEnemy.getEmail(), myEnemy.getScore());
            } else if ( code == 5 ) {
                direction.setDirection(jsonObject);
                webSocketService.notifyStartPosition(me.getEmail(), direction);
            }
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