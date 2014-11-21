package resourse;

/**
 * Created by aleksei on 21.11.14.
 */
public class DataBase implements Resource{

    private String db_host;
    private String db_port;
    private String db_name;
    private String db_user;
    private String db_password;

    public DataBase() {};

    public  DataBase(String db_host, String db_port, String db_name, String db_user, String db_password) {
        this.setHost(db_host);
        this.setPort(db_port);
        this.setName(db_name);
        this.setUser(db_user);
        this.setPassword(db_password);
    }

    public String getHost() {
      return db_host;
    }
    public String getPort() {
        return db_port;
    }
    public String getName() {
        return db_name;
    }
    public String getUser() {
        return db_user;
    }
    public String getPassword() {
        return db_password;
    }

    public void setHost(String db_host) {
        this.db_host = db_host;
    }

    public void setPort(String db_port) {
        this.db_port = db_port;
    }

    public void setName(String db_name) {
        this.db_name = db_name;
    }

    public void setUser(String db_user) {
        this.db_user = db_user;
    }

    public void setPassword(String db_password) {
        this.db_password = db_password;
    }
}
