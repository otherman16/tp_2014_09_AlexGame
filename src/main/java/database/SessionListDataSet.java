package database;

public class SessionListDataSet {
    private String session_id;
    private String user_id;

    public SessionListDataSet(String session_id, String user_id) {
        this.session_id = session_id;
        this.user_id = user_id;
    }

    public String getSession_id() {
        return session_id;
    }

    public void setSession_id(String session_id) {
        this.session_id = session_id;
    }

    public String getUser_id() {
        return user_id;
    }

    public void setUser_id(String user_id) {
        this.user_id = user_id;
    }
}
