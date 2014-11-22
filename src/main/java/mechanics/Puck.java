package mechanics;

import resourse.DataBase;

/**
 * Created by aleksei on 22.11.14.
 */
public class Puck {
    private double dnextX;
    private double dnextY;
    private double velocityX;
    private double velocityY;
    private double speed;
    private double angle;

    public Puck () {}

    public void setPuck (double dnextX, double dnextY, double velocityX, double velocityY, double speed, double angle) {
        this.setDnextX(dnextX);
        this.setDnextY(dnextY);
        this.setVelocityX(velocityX);
        this.setVelocityY(velocityY);
        this.setSpeed(speed);
        this.setAngle(angle);
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
