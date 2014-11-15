package resourse;

public class Puck implements Resource{

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
}
