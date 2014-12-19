package mechanics;

import base.GameMechanics;
import messageSystem.Address;

public final class MessageAddGamer extends MessageToGameMechanics {
    private String email;

    public MessageAddGamer(Address from, Address to, String email) {
        super(from, to);
        this.email = email;
    }

    @Override
    protected void exec (GameMechanics gameMechanics) {
        gameMechanics.addGamer(email);
    }
}
