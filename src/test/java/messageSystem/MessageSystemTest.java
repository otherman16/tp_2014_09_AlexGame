package messageSystem;

import backend.AccountServiceImpl;
import backend.MessageIncreaseScore;
import base.AccountService;
import base.DBService;
import base.WebSocketService;
import database.DBServiceImpl;
import main.ThreadSettings;
import mechanics.GameMechanicsImpl;
import mechanics.MessageAddGamer;
import mechanics.MessageStepAction;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import resourse.DataBase;
import resourse.ResourceFactory;
import websocket.WebSocketServiceImpl;

public class MessageSystemTest {

    private MessageSystem ms = new MessageSystem();
    private AccountService service = new AccountServiceImpl(ms);
    private WebSocketService webSocketService = new WebSocketServiceImpl();
    private GameMechanicsImpl gameMechanics = new GameMechanicsImpl(webSocketService, ms);
    private String email = "admin@admin.ru";
    private int scoreToIncrease = 42;

    @Before
    public void setUp() throws Exception {
        (new Thread(service)).start();
        (new Thread(gameMechanics)).start();
    }

    @After
    public void tearDown() throws Exception {

    }

    @Test
    public void messageIncreaseScoreTest () throws Exception {
        Message messageIncreaseScore = new MessageIncreaseScore(ms.getAddressService().getGameMechanicsAddress(),
                ms.getAddressService().getAccountServiceAddress(), email, scoreToIncrease);
        DataBase dataBase = (DataBase) ResourceFactory.instance().get("./data/dataBase.xml");
        DBService dbService = new DBServiceImpl(dataBase.getHost(), dataBase.getPort(), dataBase.getUser(), dataBase.getName(), dataBase.getPassword());

        int initialScore = dbService.getUserByEmail(email).getScore().intValue();
        ms.sendMessage(messageIncreaseScore);
        Thread.sleep(ThreadSettings.SERVICE_SLEEP_TIME*2);
        int resultScore = dbService.getUserByEmail(email).getScore().intValue();
        Assert.assertEquals(initialScore, resultScore - scoreToIncrease);
        service.increaseScore(email, -scoreToIncrease);
    }

    @Test
    public void messageAddGamerTest () throws InterruptedException {
        Message messageAddGamer = new MessageAddGamer(ms.getAddressService().getGameMechanicsAddress(),
                ms.getAddressService().getGameMechanicsAddress(), email);
        ms.sendMessage(messageAddGamer);
        Thread.sleep(ThreadSettings.SERVICE_SLEEP_TIME*2);
        Assert.assertEquals(email, gameMechanics.getWaiter());
    }

    @Test
    public void messageActionStepTest () throws InterruptedException {
        for ( int i = 0; i < 2; i++) {
            Message messageAddGamer = new MessageAddGamer(ms.getAddressService().getGameMechanicsAddress(),
                    ms.getAddressService().getGameMechanicsAddress(), "anotherEmail"+i);
            ms.sendMessage(messageAddGamer);
            Thread.sleep(ThreadSettings.SERVICE_SLEEP_TIME * 2);
        }
        String data = "{\"dnextY\":0,\"code\":2,\"dnextX\":0}";
        JSONObject jsonRequest = new JSONObject(data);
        Message messageStepAction = new MessageStepAction(ms.getAddressService().getGameMechanicsAddress(),
                ms.getAddressService().getGameMechanicsAddress(), "anotherEmail"+0, jsonRequest );
        ms.sendMessage(messageStepAction);
        Thread.sleep(ThreadSettings.SERVICE_SLEEP_TIME * 2);
    }
}