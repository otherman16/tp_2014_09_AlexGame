package database;

public interface SessionListDAO {

    public void createTable() throws Exception;

    public void add(String session_id, Long user_id) throws Exception;

    public Boolean isExistsBySessionId(String findSession_id) throws Exception;

    public Integer getNumber() throws Exception;

    public void delete(String session_id) throws Exception;
}
