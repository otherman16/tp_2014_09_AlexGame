package backend;

import base.DBService;
import base.ResultHandler;
import base.UserProfile;
import database.DBExecutor;

import java.sql.*;
import java.util.ArrayList;

public class DBServiceImpl implements DBService{
    private String db_url;
    private String db_user;
    private String db_password;

    private Connection db_connection;

    private DBExecutor db_executor;

    public DBServiceImpl(String db_host, String db_port, String db_name, String db_user, String db_password) {
        StringBuilder url = new StringBuilder();
        url.
                append("jdbc:mysql://").
                append(db_host).append(":").
                append(db_port).append("/").
                append(db_name).
                append("?user=").append(db_user).
                append("&password=").append(db_password);
        try {
            Class.forName("com.mysql.jdbc.Driver");
            db_connection = DriverManager.getConnection(url.toString());
            this.createUserTable();
            this.createSessionListTable();
            db_executor = new DBExecutor();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }

    private void createDBAndUser() {
        Connection root_db_connection = null;
        Statement db_statement = null;
        try {
            root_db_connection = DriverManager.getConnection("jdbc:mysql://localhost:3306?user=root&password=root");
            db_statement = root_db_connection.createStatement();
            root_db_connection.setAutoCommit(false);
            String sqlStatement = "DROP DATABASE IF EXISTS g06_alexgame_db;";
            db_statement.execute(sqlStatement);
            sqlStatement = "DROP USER 'alexgame_user'@'127.0.0.1';";
            db_statement.execute(sqlStatement);
            sqlStatement = "CREATE DATABASE IF NOT EXISTS g06_alexgame_db CHARACTER SET utf8;";
            db_statement.execute(sqlStatement);
            sqlStatement = "CREATE USER 'alexgame_user'@'127.0.0.1' IDENTIFIED BY 'alexgame_user';";
            db_statement.execute(sqlStatement);
            sqlStatement = "GRANT ALL ON g06_alexgame_db.* TO 'alexgame_user'@'127.0.0.1';";
            db_statement.execute(sqlStatement);
            root_db_connection.commit();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        } finally {
            if (db_statement != null) {
                try {
                    db_statement.close();
                } catch (Exception e) {
                    System.out.println(e.getMessage());
                }
            }
            if (root_db_connection != null) {
                try {
                    root_db_connection.close();
                } catch (Exception e) {
                    System.out.println(e.getMessage());
                }
            }
        }
    }

    private void createUserTable() throws Exception {
        String createTableSQL = "CREATE TABLE IF NOT EXISTS user("
                                + "id INT(9) UNSIGNED NOT NULL AUTO_INCREMENT, "
                                + "login VARCHAR(20) NOT NULL DEFAULT \"guest\", "
                                + "email VARCHAR(20) NOT NULL DEFAULT \"guest\", "
                                + "password VARCHAR(20) NOT NULL DEFAULT \"guest\", "
                                + "score INT(6) UNSIGNED NOT NULL DEFAULT 0, "
                                + "PRIMARY KEY (id), "
                                + "KEY (email)"
                                + ");";
        db_executor.execUpdate(db_connection, createTableSQL);
    }

    private void createSessionListTable() throws Exception {
        String createTableSQL = "DROP TABLE IF EXISTS session_list;";
        db_executor.execUpdate(db_connection, createTableSQL);
        createTableSQL = "CREATE TABLE IF NOT EXISTS session_list("
                        + "session_id VARCHAR(30) NOT NULL DEFAULT \"\", "
                        + "user_id INT(9) UNSIGNED NOT NULL DEFAULT 0, "
                        + "PRIMARY KEY HASH(session_id), "
                        + "FOREIGN KEY (user_id) REFERENCES user(id) "
                        + "ON UPDATE CASCADE "
                        + "ON DELETE CASCADE "
                        + ") ENGINE=MEMORY;";
        db_executor.execUpdate(db_connection, createTableSQL);
    }

    public void addUser(UserProfile user) throws Exception {
        String sqlStatement = "INSERT INTO user (login,email,password,score) VALUES (\"" + user.getLogin() + "\",\"" + user.getEmail() + "\",\"" + user.getPassword() + "\"," + user.getScore() + ");";
        db_executor.execUpdate(db_connection, sqlStatement);
    }

    public void addSession(String session_id, Long user_id) throws Exception {
        String sqlStatement = "INSERT INTO session_list (session_id,user_id) VALUES (\"" + session_id + "\"," + user_id + ");";
        db_executor.execUpdate(db_connection, sqlStatement);
    }

    public Boolean hasUserByEmail(String findEmail) throws Exception {
        String sqlStatement = "SELECT COUNT(*) as count FROM user WHERE email = \"" + findEmail + "\";";
        return db_executor.execQuery(db_connection, sqlStatement, new ResultHandler<Boolean>() {
            @Override
            public Boolean handle(ResultSet result) throws Exception{
                int count = 0;
                while (result.next()) {
                    count = result.getInt("count");
                }
                return count == 1;
            }
        });
    }

    public Boolean hasUserBySessionId(String findSession_id) throws Exception {
        String sqlStatement = "SELECT COUNT(*) as count FROM session_list WHERE session_id = \"" + findSession_id + "\";";
        return db_executor.execQuery(db_connection, sqlStatement, new ResultHandler<Boolean>() {
            @Override
            public Boolean handle(ResultSet result) throws Exception{
                int count = 0;
                while (result.next()) {
                    count = result.getInt("count");
                }
                return count == 1;
            }
        });
    }

    public UserProfile getUserByEmail(String findEmail) throws Exception {
        String sqlStatement = "SELECT * FROM user WHERE email = \"" + findEmail + "\";";
        return db_executor.execQuery(db_connection, sqlStatement, new ResultHandler<UserProfile>() {
            @Override
            public UserProfile handle(ResultSet result) throws Exception {
                Long id = 0L;
                String login = "Guest";
                String email = "";
                String password = "";
                Long score = 0L;
                while (result.next()) {
                    id = result.getLong("id");
                    login = result.getString("login");
                    email = result.getString("email");
                    password = result.getString("password");
                    score = result.getLong("score");
                }
                return new UserProfile(id,login,email,password,score);
            }
        });
    }

    public UserProfile getUserBySessionId(String findSession_id) throws Exception {
        String sqlStatement = "SELECT user.id, user.login, user.email, user.password, user.score FROM user " +
                                "JOIN session_list ON user.id = session_list.user_id " +
                                "WHERE session_list.session_id = \"" + findSession_id + "\";";
        return db_executor.execQuery(db_connection, sqlStatement, new ResultHandler<UserProfile>() {
            @Override
            public UserProfile handle(ResultSet result) throws Exception {
                Long id = 0l;
                String login = "Guest";
                String email = "";
                String password = "";
                Long score = 0L;
                while (result.next()) {
                    id = result.getLong("id");
                    login = result.getString("login");
                    email = result.getString("email");
                    password = result.getString("password");
                    score = result.getLong("score");
                }
                return new UserProfile(id,login,email,password,score);
            }
        });
    }

    public void removeSessionFromSessionList(String session_id) throws Exception {
        String sqlStatement = "DELETE FROM session_list " +
                                "WHERE session_id = \"" + session_id + "\";";
        db_executor.execUpdate(db_connection, sqlStatement);
    }

    public Integer getCountUser() throws Exception {
        String sqlStatement = "SELECT COUNT(*) as count FROM user;";
        return db_executor.execQuery(db_connection, sqlStatement, new ResultHandler<Integer>() {
            @Override
            public Integer handle(ResultSet result) throws Exception {
                int count = 0;
                while (result.next()) {
                    count = result.getInt("count");
                }
                return count;
            }
        });
    }

    public Integer getCountSessionList() throws Exception {
        String sqlStatement = "SELECT COUNT(*) as count FROM session_list;";
        return db_executor.execQuery(db_connection, sqlStatement, new ResultHandler<Integer>() {
            @Override
            public Integer handle(ResultSet result) throws Exception {
                int count = 0;
                while (result.next()) {
                    count = result.getInt("count");
                }
                return count;
            }
        });
    }

    public ArrayList<UserProfile> getTop10() throws Exception {
        String sqlStatement = "SELECT * FROM user " +
                                "ORDER BY -score " +
                                "LIMIT 10;";
        return db_executor.execQuery(db_connection, sqlStatement, new ResultHandler<ArrayList<UserProfile>>() {
            @Override
            public ArrayList<UserProfile> handle(ResultSet result) throws Exception {
                ArrayList<UserProfile> users = new ArrayList<>();
                while (result.next()) {
                    Long id = result.getLong("id");
                    String login = result.getString("login");
                    String email = result.getString("email");
                    String password = result.getString("password");
                    Long score = result.getLong("score");
                    users.add(new UserProfile(id,login,email,password,score));
                }
                return users;
            }
        });
    }

    public void deleteUserFromUser(String email) throws Exception {
        String sqlStatement = "DELETE FROM user " +
                "WHERE email = \"" + email+ "\";";
        db_executor.execUpdate(db_connection, sqlStatement);
    }
}
