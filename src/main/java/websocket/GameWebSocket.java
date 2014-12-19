package websocket;


import base.WebSocketService;
import mechanics.MessageAddGamer;
import messageSystem.Abonent;
import messageSystem.Address;
import messageSystem.Message;
import messageSystem.MessageSystem;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.json.JSONObject;

@WebSocket
public class GameWebSocket implements Abonent {

    private final Address address = new Address();
    private final MessageSystem messageSystem;

    private String gamerEmail;
    private Session session;
    private WebSocketService webSocketService;

    public GameWebSocket(String gamerEmail, WebSocketService webSocketService, MessageSystem ms) {
        this.messageSystem = ms;
        messageSystem.addService(this);
        messageSystem.getAddressService().registerGameWebSocket(this);
        this.gamerEmail = gamerEmail;
        this.webSocketService = webSocketService;
    }

    public Address getAddress() {
        return address;
    }

    public MessageSystem getMessageSystem() {
        return messageSystem;
    }

    @OnWebSocketConnect
    public void onOpen(Session session) {
        setSession(session);
        webSocketService.addSocket(this);
        Message messageAddGamer = new MessageAddGamer(getAddress(),
                messageSystem.getAddressService().getGameMechanicsAddress(), gamerEmail);
        messageSystem.sendMessage(messageAddGamer);
    }

    @OnWebSocketClose
    public void onClose(int statusCode, String reason) {

    }

    @OnWebSocketMessage
    public void onMessage(String data)  {
        try {
            JSONObject jsonRequest = new JSONObject(data);
            Message messageStepAction = new mechanics.MessageStepAction(getAddress(),
                    messageSystem.getAddressService().getGameMechanicsAddress(), gamerEmail, jsonRequest );
            messageSystem.sendMessage(messageStepAction);
        } catch (Exception e) {
            System.out.println("Exception in GameWebSocket.onMessage: " + e.getMessage());
        }
    }

    public String getMyName() {
        return gamerEmail;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public void sendResponse(JSONObject jsonRequest) {
        try {
            session.getRemote().sendString(jsonRequest.toString());
        } catch (Exception e) {
            System.out.print(e.getMessage());
        }
    }
}
