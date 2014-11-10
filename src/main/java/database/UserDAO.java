package database;

import java.sql.Connection;

public class UserDAO {

    private Connection db_connection;

    public UserDAO(Connection db_connection) {
        this.db_connection = db_connection;
    }

    public void createTable() throws Exception {
        String createTableSQL = "CREATE TABLE IF NOT EXISTS user("
                + "id INT(9) UNSIGNED NOT NULL AUTO_INCREMENT, "
                + "login VARCHAR(20) NOT NULL DEFAULT \"guest\", "
                + "email VARCHAR(20) NOT NULL DEFAULT \"guest\", "
                + "password VARCHAR(20) NOT NULL DEFAULT \"guest\", "
                + "score INT(6) UNSIGNED NOT NULL DEFAULT 0, "
                + "PRIMARY KEY (id), "
                + "KEY (email)"
                + ");";
        DBExecutor.execUpdate(db_connection, createTableSQL);
    }

    public void addUser(UserProfile user) throws Exception {
        String sqlStatement = "INSERT INTO user (login,email,password,score) VALUES (\"" + user.getLogin() + "\",\"" + user.getEmail() + "\",\"" + user.getPassword() + "\"," + user.getScore() + ");";
        DBExecutor.execUpdate(db_connection, sqlStatement);
    }
}
