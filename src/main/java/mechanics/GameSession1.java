package mechanics;

import base.Gamer;

import java.util.Date;

public class GameSession1 {
    private final long startTime;
    private final Gamer gamer1;
    private final Gamer gamer2;
    private boolean isActive;

    public GameSession1(String gamerEmail1, String gamerEmail2) {
        startTime = new Date().getTime();
        this.gamer1 = new Gamer(gamerEmail1);
        this.gamer2 = new Gamer(gamerEmail2);
        isActive = true;
    }

    public Gamer getGamer(String gamerEmail) {
        if (gamer1.getEmail().equals(gamerEmail)) {
            return gamer1;
        }
        else {
            return gamer2;
        }
    }

    public Gamer getGamerEnemy(String gamerEmail) {
        if (gamer1.getEmail().equals(gamerEmail)) {
            return gamer2;
        }
        else {
            return gamer1;
        }
    }

    public boolean isActive() { return isActive; }

    public long getSessionTime(){
        return new Date().getTime() - startTime;
    }

    public Gamer getGamer1() {
        return gamer1;
    }

    public Gamer getGamer2() {
        return gamer2;
    }

    public void closeGameSession() {
        isActive = false;
    }
}
