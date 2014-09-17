package frontend;

/**
 * Created by otherman on 15.09.14.
 */
public class UserProfile {

    public String login;
    public String email;
    public String password;

    public UserProfile(String login, String email, String password) {
        this.login = login;
        this.email = email;
        this.password = password;
    }
}
