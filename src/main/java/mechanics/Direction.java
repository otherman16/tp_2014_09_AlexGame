package mechanics;

import org.json.JSONObject;

public class Direction {
    private double dnextX;
    private double dnextY;

    public void setDirection ( JSONObject jsonObject) {
        this.setDnextX(jsonObject.getDouble("dnextX"));
        this.setDnextY(jsonObject.getDouble("dnextY"));
    }

    public void setDnextX (double dnextX) { this.dnextX = dnextX;}
    public void setDnextY (double dnextY) { this.dnextY = dnextY;}

    public double getDnextX () {return dnextX;}
    public double getDnextY () {return dnextY;}

    public void inverse() {
        this.dnextX = -this.dnextX;
        this.dnextY = -this.dnextY;
    }
}
