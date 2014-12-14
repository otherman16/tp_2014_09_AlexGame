package websocket;

import base.GameMechanics;
import base.WebSocketService;
import junit.framework.TestCase;
import mechanics.GameMechanicsImpl;
import org.junit.Assert;
import org.junit.Test;

import java.util.HashMap;

import static org.junit.Assert.*;

public class WebSocketServiceImplTest extends TestCase {

    private WebSocketService webSocketService = new WebSocketServiceImpl();
    private String gamerEmail = "admin@admin.ru";
    private GameMechanics gameMechanics = new GameMechanicsImpl(webSocketService);
    private GameWebSocket gameWebSocket = new GameWebSocket(gamerEmail, gameMechanics, webSocketService);

    public void testAddSocketOk() throws Exception {
        webSocketService.addSocket(gameWebSocket);
        Assert.assertEquals(true, webSocketService.exists(gamerEmail));
        webSocketService.deleteSocket(gamerEmail);
    }

    public void testAddSocketFail() throws Exception {
        Assert.assertEquals(false, webSocketService.exists(gamerEmail));
    }

    public void testGetExistingOk() throws Exception {
        webSocketService.addSocket(gameWebSocket);
        Assert.assertEquals(gameWebSocket, webSocketService.getExisting(gamerEmail));
        webSocketService.deleteSocket(gamerEmail);
    }

    public void testGetExistingFail() throws Exception {
        webSocketService.addSocket(gameWebSocket);
        String gamerEmailFalse = "false@false.ru";
        Assert.assertEquals(null ,webSocketService.getExisting(gamerEmailFalse));
        webSocketService.deleteSocket(gamerEmail);
    }
}