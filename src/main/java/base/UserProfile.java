package base;

/**
 * Created by Алексей on 23.09.2014.
 */
public class UserProfile {
    private Long id;
    private String login;
    private String email;
    private String password;
    private Long score;
    public UserProfile(String login, String email, String password) {
        this.id = 0L;
        this.login = login;
        this.email = email;
        this.password = password;
        this.score = 0L;
    }
    public UserProfile(Long id, String login, String email, String password, Long score) {
        this.id = id;
        this.login = login;
        this.email = email;
        this.password = password;
        this.score = score;
    }

    public String getLogin() {
        return login;
    }
    public String getEmail() {
        return email;
    }
    public String getPassword() {
        return password;
    }
    public Long getScore() {
        return score;
    }
    public Long getId() {
        return id;
    }

    public void setLogin(String login) {
        this.login = login;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public void setScore(Long score) {
        this.score = score;
    }
}
