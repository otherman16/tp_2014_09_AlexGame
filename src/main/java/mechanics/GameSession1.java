package mechanics;

import base.Gamer;

import java.util.Date;

public class GameSession1 {
    private final long startTime;
    private final String gamer1Email;
    private final String gamer2Email;
    private boolean isActive;

    public GameSession1(String gamer1Email, String gamer2Email) {
        startTime = new Date().getTime();
        this.gamer1Email = gamer1Email;
        this.gamer2Email = gamer2Email;
        isActive = true;
    }

    public String getGamer(String gamerEmail) {
        if (gamer1Email.equals(gamerEmail)) {
            return gamer1Email;
        }
        else {
            return gamer2Email;
        }
    }

    public String getGamerEnemy(String gamerEmail) {
        if (gamer1Email.equals(gamerEmail)) {
            return gamer2Email;
        }
        else {
            return gamer1Email;
        }
    }

    public boolean isActive() { return isActive; }

    public long getSessionTime(){
        return new Date().getTime() - startTime;
    }

    public String getGamer1() {
        return gamer1Email;
    }

    public String getGamer2() {
        return gamer2Email;
    }

    public void closeGameSession() {
        isActive = false;
    }
}
