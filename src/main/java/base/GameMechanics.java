package base;

import org.json.JSONObject;

/**
 * Created by aleksei on 20.10.14.
 */
public interface GameMechanics {

    public void addGamer(String gamerEmail);

    public void enemyStepAction(String gamerEnemyEmail, JSONObject jsonObject);

    public void run();
}