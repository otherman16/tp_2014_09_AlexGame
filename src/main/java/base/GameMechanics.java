package base;

import messageSystem.Abonent;
import org.json.JSONObject;

public interface GameMechanics extends Runnable, Abonent {

    boolean isFirstWin();

    void addGamer(String gamerEmail);

    void stepAction(String gamerEmail, JSONObject jsonObject);

    void runGameMechanics();
}