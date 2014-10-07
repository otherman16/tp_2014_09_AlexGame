package account_service;

/**
 * Created by Алексей on 23.09.2014.
 */
public class UserProfile {
    public Long id;
    public String login;
    public String email;
    public String password;
    public Long score;
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
}
