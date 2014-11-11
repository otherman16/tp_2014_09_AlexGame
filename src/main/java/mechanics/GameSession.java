package mechanics;

import java.util.Date;

public class GameSession {
    private final long startTime;
    private final Gamer first;
    private final Gamer second;
    private boolean isActive;

    public GameSession(String gamer1Email, String gamer2Email) {
        startTime = new Date().getTime();
        this.first = new Gamer(gamer1Email);
        this.second = new Gamer(gamer2Email);
        isActive = true;
    }

    public Gamer getGamer(String gamerEmail) {
        if (first.getEmail().equals(gamerEmail)) {
            return first;
        }
        else {
            return second;
        }
    }

    public Gamer getGamerEnemy(String gamerEnemyEmail) {
        if (first.getEmail().equals(gamerEnemyEmail)) {
            return second;
        }
        else {
            return first;
        }
    }

    public boolean isFirstWin() {
        return first.getScore() > second.getScore();
    }

    public Gamer getFirst() {
        return first;
    }

    public Gamer getSecond() {
        return second;
    }

    public long getSessionTime(){
        return new Date().getTime() - startTime;
    }

    public boolean isActive() { return isActive; }

    public void closeGameSession() {
        this.isActive = false;
    }
}
