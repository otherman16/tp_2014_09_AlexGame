package base;

import org.json.JSONObject;

public interface GameMechanics {

    void addGamer(String gamerEmail);

    void enemyStepAction(String gamerEnemyEmail, JSONObject jsonObject);

    void run();
}