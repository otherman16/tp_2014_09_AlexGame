package websocket;

import base.WebSocketService;
import junit.framework.TestCase;
import messageSystem.MessageSystem;
import org.junit.Assert;

public class WebSocketServiceImplTest extends TestCase {
    private MessageSystem ms = new MessageSystem();

    private WebSocketService webSocketService = new WebSocketServiceImpl();
    private String gamerEmail = "admin@admin.ru";
    private GameWebSocket gameWebSocket = new GameWebSocket(gamerEmail, webSocketService, ms);

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