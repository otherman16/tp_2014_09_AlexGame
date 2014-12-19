package base;

import org.json.JSONObject;

public interface GameMechanics extends Runnable  {

    boolean isFirstWin();

    void addGamerOrJoystick(String gamerEmail);

    void StepAction(String gamerEnemyEmail, JSONObject jsonObject);

    void runGameMechanics();
}