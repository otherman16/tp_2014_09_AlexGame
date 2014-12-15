package mechanics;

import backend.AccountServiceImpl;
import base.GameMechanics;
import base.UserProfile;
import base.WebSocketService;
import junit.framework.TestCase;
import messageSystem.MessageSystem;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.servlet.ServletUpgradeRequest;
import org.eclipse.jetty.websocket.servlet.ServletUpgradeResponse;
import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;
import websocket.CustomWebSocketCreator;
import websocket.GameWebSocket;
import websocket.WebSocketServiceImpl;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import static org.mockito.Mockito.when;

public class GameMechanicsImplTest extends TestCase {

    private JSONObject json1 = new JSONObject();
    private JSONObject json2 = new JSONObject();
    private JSONObject json3 = new JSONObject();
    private String gamer1 = "gamer1";
    private String gamer2 = "gamer2";

    private MessageSystem ms = new MessageSystem();

    private AccountServiceImpl service = new AccountServiceImpl(ms);
    private WebSocketService webSocketService = new WebSocketServiceImpl();
    private GameMechanics gameMechanics = new GameMechanicsImpl(webSocketService, ms);
    private HttpSession httpSession1 = Mockito.mock(HttpSession.class);
    private HttpSession httpSession2 = Mockito.mock(HttpSession.class);
    private Session session1 = Mockito.mock(Session.class);
    private Session session2 = Mockito.mock(Session.class);
    private HttpServletRequest httpServletRequest = Mockito.mock(HttpServletRequest.class);
    private ServletUpgradeRequest request = Mockito.mock(ServletUpgradeRequest.class);
    private ServletUpgradeResponse response = Mockito.mock(ServletUpgradeResponse.class);
    private CustomWebSocketCreator customWebSocketCreator = new CustomWebSocketCreator(service, gameMechanics, webSocketService);

    private JSONObject json =  (new JSONObject()).put("code", 3);

    private UserProfile getAdminUser() {
        String authLogin = "admin";
        String authEmail = "admin@admin.ru";
        String authPass = "admin";
        return new UserProfile(authLogin, authEmail, authPass);
    }

    private UserProfile getLoginUser() {
        String loginLogin = "login";
        String loginEmail = "login@login.ru";
        String loginPass = "login";
        return new UserProfile(loginLogin, loginEmail, loginPass);
    }

    private void setJson1 () {
        json1.put("code", 1);
        json1.put("dnextX", 0);
        json1.put("dnextY", 0);
        json1.put("velocityX", 0);
        json1.put("velocityY", 0);
        json1.put("speed", 0);
        json1.put("angle", 0);
    }

    private void setJson2 () {
        json2.put("code", 2);
        json2.put("dnextX", 0);
        json2.put("dnextY", 0);
    }

    private void setJson3 () {
        json3.put("code", 3);
    }

    public void testRun() throws Exception {

    }

    public void testEnemyStepActionKick() throws Exception {
        setJson1();
        gameMechanics.addGamer(gamer1);
        gameMechanics.addGamer(gamer2);
        gameMechanics.enemyStepAction(gamer1, json1);
    }

    public void testEnemyStepActionPosition() throws Exception {
        setJson2();
        gameMechanics.addGamer(gamer1);
        gameMechanics.addGamer(gamer2);
        gameMechanics.enemyStepAction(gamer1, json2);
    }

    public void testEnemyStepActionScore() throws Exception {
        setJson3();
        gameMechanics.addGamer(gamer1);
        gameMechanics.addGamer(gamer2);
        gameMechanics.enemyStepAction(gamer1, json3);
    }

    public void helpWinnerDetect () {
        service.authUser(getAdminUser(), httpSession1);
        when(request.getHttpServletRequest()).thenReturn(httpServletRequest);
        when(httpServletRequest.getSession()).thenReturn(httpSession1);
        GameWebSocket gameWebSocket1 = (GameWebSocket)customWebSocketCreator.createWebSocket(request, response);

        service.registerUser(getLoginUser(), httpSession2);
        service.logoutUser(httpSession2);
        service.authUser(getLoginUser(), httpSession2);
        when(request.getHttpServletRequest()).thenReturn(httpServletRequest);
        when(httpServletRequest.getSession()).thenReturn(httpSession2);
        GameWebSocket gameWebSocket2 = (GameWebSocket)customWebSocketCreator.createWebSocket(request, response);

        gameWebSocket1.onOpen(session1);
        gameWebSocket2.onOpen(session2);
    }

    @Test
    public void FirstWinOk() throws Exception {
        this.helpWinnerDetect();
        gameMechanics.enemyStepAction(getAdminUser().getEmail(), json);
        Assert.assertEquals(true, gameMechanics.isFirstWin());
    }

    @Test
    public void FirstWinFail() throws Exception {
        this.helpWinnerDetect();
        gameMechanics.enemyStepAction(getLoginUser().getEmail(), json);
        Assert.assertEquals(false, gameMechanics.isFirstWin());
    }


    @Test
    public void SecondWinOk() throws Exception {
        this.helpWinnerDetect();
        for (int i = 0; i < 10; i++)
            gameMechanics.enemyStepAction(getAdminUser().getEmail(), json);
        for (int i = 0; i < 42; i++)
            gameMechanics.enemyStepAction(getLoginUser().getEmail(), json);
        Assert.assertEquals(false, gameMechanics.isFirstWin());
    }

    @Test
    public void SecondWinFail() throws Exception {
        this.helpWinnerDetect();
        for (int i = 0; i < 42; i++)
            gameMechanics.enemyStepAction(getAdminUser().getEmail(), json);
        for (int i = 0; i < 10; i++)
            gameMechanics.enemyStepAction(getLoginUser().getEmail(), json);
        Assert.assertEquals(true, gameMechanics.isFirstWin());
    }
}