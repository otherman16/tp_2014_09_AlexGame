package database;

public class UserDataSet {
    private long id;
    private String email;
    private String login;
    private long score;

    public UserDataSet(long id, String email, String login, long score) {
        this.id = id;
        this.email = email;
        this.login = login;
        this.score = score;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public long getScore() {
        return score;
    }

    public void setScore(long score) {
        this.score = score;
    }
}
