package resourse;

/**
 * Created by aleksei on 21.11.14.
 */
public class Admin implements Resource{
    private String id;
    private String name;
    private String email;
    private String password;
    private  String score;

    public Admin() {}
    public Admin (String id, String name, String email, String password, String score) {
        this.setId(id);
        this.setName(name);
        this.setEmail(email);
        this.setPassword(password);
        this.setScore(score);
    }

    public void setId(String id) {this.id = id;}
    public void setName(String name) {this.name = name;}
    public void setEmail(String email) {this.email = email;}
    public void setPassword(String password) {this.password = password;}
    public void setScore(String score) {this.score = score;}

    public String getId() {return id;}
    public String getName() {return name;}
    public String getEmail() {return email;}
    public String getPassword() {return password;}
    public String getScore() {return score;}

}
