package base;

/**
 * Created by aleksei on 20.10.14.
 */
public interface GameMechanics {

    public void addGamer(String gamerEmail);

    public void enemyStepAction(String gamerEnemyEmail, int x, int y);

    public void run();
}