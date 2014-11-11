package mechanics;

public class Gamer {
    private final String email;
    private int score;

    public Gamer(String email) {
        this.email = email;
        this.score = 0;
    }

    public String getEmail() {
        return email;
    }

    public int getScore() {
        return score;
    }

    public void incrementScore() {
        score++;
    }
}
