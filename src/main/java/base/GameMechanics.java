package base;

import org.json.JSONObject;

public interface GameMechanics extends Runnable  {

    boolean isFirstWin();

    void gmStep();

    void addGamer(String gamerEmail);

    void enemyStepAction(String gamerEnemyEmail, JSONObject jsonObject);

    void runGameMechanics();
}