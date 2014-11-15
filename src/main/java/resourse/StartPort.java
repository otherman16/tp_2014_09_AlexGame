package resourse;

import java.io.Serializable;

public class StartPort  {

    private int port;

    public StartPort() {
        this.port = 0;
    }

    public StartPort(int port) {
        this.setPort(port);
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String toString() {
        return  " port: " + port;
    }
}
