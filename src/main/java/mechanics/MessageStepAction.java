package mechanics;

import base.GameMechanics;
import messageSystem.Address;
import org.json.JSONObject;

public class MessageStepAction extends MessageToGameMechanics {
    private String email;
    private JSONObject jsonObject;

    public MessageStepAction (Address from, Address to, String email, JSONObject json) {
        super(from, to);
        this.email = email;
        this.jsonObject = json;
    }

    @Override
    protected void exec (GameMechanics gameMechanics) {
        gameMechanics.stepAction(email, jsonObject);
    }
}
