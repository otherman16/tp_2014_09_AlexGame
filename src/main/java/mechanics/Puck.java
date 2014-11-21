package mechanics;

import resourse.DataBase;

/**
 * Created by aleksei on 22.11.14.
 */
public class Puck {
    private Double dnextX;
    private Double dnextY;
    private Double velocityX;
    private Double velocityY;
    private Double speed;
    private Double angle;

    public Puck () {}

    public void setPuck (Double dnextX, Double dnextY, Double velocityX, Double velocityY, Double speed, Double angle) {
        this.setDnextX(dnextX);
        this.setDnextY(dnextY);
        this.setVelocityX(velocityX);
        this.setVelocityY(velocityY);
        this.setSpeed(speed);
        this.setAngle(angle);
    }

    public void setDnextX (Double dnextX) { this.dnextX = dnextY;}
    public void setDnextY (Double dnextY) { this.dnextY = dnextY;}
    public void setVelocityX (Double velocityX) { this.velocityX = velocityX;}
    public void setVelocityY (Double velocityY) { this.velocityY = velocityY;}
    public void setSpeed (Double speed) { this.speed = speed;}
    public void setAngle (Double angle) { this.angle =angle;}

    public Double getDnextX () {return dnextX;}
    public Double getDnextY () {return dnextY;}
    public Double getVelocityX () {return velocityX;}
    public Double getVelocityY () { return velocityY;}
    public Double getSpeed () {return speed;}
    public Double getAngle () {return angle;}
}
