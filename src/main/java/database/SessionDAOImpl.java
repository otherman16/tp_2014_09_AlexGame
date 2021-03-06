package database;

import java.sql.Connection;
import java.sql.ResultSet;

public class SessionDAOImpl implements SessionDAO {

    private Connection db_connection;

    public SessionDAOImpl(Connection db_connection) {
        this.db_connection = db_connection;
    }

    @Override
    public void createTable() throws Exception {
        String createTableSQL = "DROP TABLE IF EXISTS session;";
        DBExecutor.execUpdate(db_connection, createTableSQL);
        createTableSQL = "CREATE TABLE IF NOT EXISTS session("
                + "id VARCHAR(30) NOT NULL DEFAULT \"\", "
                + "user_id INT(9) UNSIGNED NOT NULL DEFAULT 0, "
                + "PRIMARY KEY HASH(id), "
                + "FOREIGN KEY (user_id) REFERENCES user(id) "
                + "ON UPDATE CASCADE "
                + "ON DELETE CASCADE "
                + ") ENGINE=MEMORY;";
        DBExecutor.execUpdate(db_connection, createTableSQL);
    }

    @Override
    public void add(String session_id, Long user_id) throws Exception {
        String sqlStatement = "INSERT INTO session (id,user_id) VALUES (\"" + session_id + "\"," + user_id + ");";
        DBExecutor.execUpdate(db_connection, sqlStatement);
    }

    @Override
    public Boolean isExistsBySessionId(String findSession_id) throws Exception {
        String sqlStatement = "SELECT COUNT(*) as count FROM session WHERE id = \"" + findSession_id + "\";";
        return DBExecutor.execQuery(db_connection, sqlStatement, new ResultHandler<Boolean>() {
            @Override
            public Boolean handle(ResultSet result) throws Exception{
                int count = 0;
                if (result.first()) {
                    count = result.getInt("count");
                }
                return count == 1;
            }
        });
    }

    @Override
    public Integer getNumber() throws Exception {
        String sqlStatement = "SELECT COUNT(*) as count FROM session;";
        return DBExecutor.execQuery(db_connection, sqlStatement, new ResultHandler<Integer>() {
            @Override
            public Integer handle(ResultSet result) throws Exception {
                int count = 0;
                if (result.first()) {
                    count = result.getInt("count");
                }
                return count;
            }
        });
    }

    @Override
    public void delete(String session_id) throws Exception {
        String sqlStatement = "DELETE FROM session " +
                "WHERE id = \"" + session_id + "\";";
        DBExecutor.execUpdate(db_connection, sqlStatement);
    }
}
