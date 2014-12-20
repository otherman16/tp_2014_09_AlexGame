package mechanics;


import org.json.JSONObject;

public class Puck {
    private double dnextX;
    private double dnextY;
    private double velocityX;
    private double velocityY;
    private double speed;
    private double angle;

    public Puck () {}

    public void setPuck ( JSONObject jsonObject) {
        this.setDnextX(jsonObject.getDouble("dnextX"));
        this.setDnextY(jsonObject.getDouble("dnextY"));
        this.setVelocityX(jsonObject.getDouble("velocityX"));
        this.setVelocityY(jsonObject.getDouble("velocityY"));
        this.setSpeed(jsonObject.getDouble("speed"));
        this.setAngle(jsonObject.getDouble("angle"));
    }

    public void setDnextX (double dnextX) { this.dnextX = dnextX;}
    public void setDnextY (double dnextY) { this.dnextY = dnextY;}
    public void setVelocityX (double velocityX) { this.velocityX = velocityX;}
    public void setVelocityY (double velocityY) { this.velocityY = velocityY;}
    public void setSpeed (double speed) { this.speed = speed;}
    public void setAngle (double angle) { this.angle =angle;}

    public double getDnextX () {return dnextX;}
    public double getDnextY () {return dnextY;}
    public double getVelocityX () {return velocityX;}
    public double getVelocityY () { return velocityY;}
    public double getSpeed () {return speed;}
    public double getAngle () {return angle;}
}
