package base;

/**
 * Created by aleksei on 20.10.14.
 */
public interface GameMechanics {

    public void addSocket(String socketName);

    public void stepAction(String userName, String data);

    public void run();
}