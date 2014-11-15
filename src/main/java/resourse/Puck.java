package resourse;

/**
 * Created by aleksei on 15.11.14.
 */
public class Puck {

    private String speed;

    public Puck() {
        this.speed = "0";
    }

    public Puck(String speed) {
        this.setSpeed(speed);
    }

    public String getSpeed() {
        return speed;
    }

    public void setSpeed(String port) {
        this.speed = port;
    }

    public String toString() {
        return  " port: " + speed;
    }
}
