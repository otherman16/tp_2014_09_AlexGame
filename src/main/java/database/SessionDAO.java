package database;

public interface SessionDAO {

    void createTable() throws Exception;

    void add(String session_id, Long user_id) throws Exception;

    Boolean isExistsBySessionId(String findSession_id) throws Exception;

    Integer getNumber() throws Exception;

    void delete(String session_id) throws Exception;
}
