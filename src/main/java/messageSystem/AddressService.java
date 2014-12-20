package messageSystem;

import base.AccountService;
import base.GameMechanics;
import websocket.GameWebSocket;

public class AddressService {

    private Address gameMechanics;
    private Address gameWebSocket;
    private Address accountService;

    public void registerGameMechanics(GameMechanics gameMechanics) {
        this.gameMechanics = gameMechanics.getAddress();
    }

    public void registerAccountService(AccountService accountService) {
        this.accountService = accountService.getAddress();
    }

    public void registerGameWebSocket(GameWebSocket gameWebSocket) {
        this.gameWebSocket = gameWebSocket.getAddress();
    }

    public Address getGameMechanicsAddress() { return gameMechanics; }

    public Address getAccountServiceAddress() {
            return accountService;
    }
}
