package backend;

import base.DBService;
import base.UserProfile;

import java.sql.*;
import java.util.ArrayList;

/**
 * Created by Алексей on 05.10.2014.
 */
public class DBServiceImpl implements DBService{
    private String db_url;
    private String db_user;
    private String db_password;

    private static Connection db_connection;

    private static java.sql.Statement db_statement;

    public DBServiceImpl(String db_url, String db_user, String db_password) {
        this.db_user = db_user;
        this.db_url = db_url;
        this.db_password = db_password;
        try {
            Class.forName("com.mysql.jdbc.Driver");
            this.doDBConnection();
            db_statement = db_connection.createStatement();
            this.createUserTable();
            this.createSessionListTable();
            System.out.println("Connection to DB was successful!");
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
        } catch (SQLException e) {
            System.out.println(e.getMessage());
        } catch (ClassNotFoundException e) {
            System.out.println(e.getMessage());
        }
    }
// Произвести соединение с MySQL базой
    private void doDBConnection() {
        try {
            db_connection = DriverManager.getConnection(this.db_url, this.db_user, this.db_password);
        } catch (SQLException e) {
            System.out.println(e.getMessage());
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
        }
    }
// Создать базу alexgame_db и пользователя ALEXGAME_USER
    private void createDBAndUser() {
        Connection root_db_connection = null;
        try {
            root_db_connection = DriverManager.getConnection("jdbc:mysql://localhost", "root", "root");
            Statement db_statement = root_db_connection.createStatement();
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
        } catch (SQLException e) {
            System.out.println(e.getMessage());
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
        } finally {
            if (root_db_connection != null) {
                try {
                    root_db_connection.close();
                } catch(SQLException e) {
                    System.out.println(e.getMessage());
                }
            }
        }
    }
// Создать таблицу "user" в базе "alexgame_db"
    private void createUserTable() {
        try {
            String createTableSQL = "CREATE TABLE IF NOT EXISTS user("
                            + "id INT(9) UNSIGNED NOT NULL AUTO_INCREMENT, "
                            + "login VARCHAR(20) NOT NULL DEFAULT \"guest\", "
                            + "email VARCHAR(20) NOT NULL DEFAULT \"guest\", "
                            + "password VARCHAR(20) NOT NULL DEFAULT \"guest\", "
                            + "score INT(6) UNSIGNED NOT NULL DEFAULT 0, "
                            + "PRIMARY KEY (id), "
                            + "KEY (email)"
                            + ");";
            db_statement.execute(createTableSQL);
        } catch (SQLException e) {
            System.out.println(e.getMessage());
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
        }
    }
// Создать таблицу "sessionlist" в базе "alexgame_db"
    private void createSessionListTable() {
        try {
            String createTableSQL = "DROP TABLE IF EXISTS session_list;";
            db_statement.execute(createTableSQL);
            createTableSQL = "CREATE TABLE IF NOT EXISTS session_list("
                            + "session_id VARCHAR(30) NOT NULL DEFAULT \"\", "
                            + "user_id INT(9) UNSIGNED NOT NULL DEFAULT 0, "
                            + "PRIMARY KEY HASH(session_id), "
                            + "FOREIGN KEY (user_id) REFERENCES user(id) "
                            + "ON UPDATE CASCADE "
                            + "ON DELETE CASCADE "
                            + ") ENGINE=MEMORY;";
            db_statement.execute(createTableSQL);
        } catch (SQLException e) {
            System.out.println(e.getMessage());
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
        }
    }
// Добавить запись в таблице "user"
    public boolean addUser(UserProfile user) {
        String sqlStatement = "INSERT INTO user (login,email,password,score) VALUES (\"" + user.getLogin() + "\",\"" + user.getEmail() + "\",\"" + user.getPassword() + "\"," + user.getScore() + ");";
        try {
            db_statement.execute(sqlStatement);
            return true;
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return false;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }
// Добавить запись в таблице "session_list"
    public boolean addSession(String session_id, Long user_id) {
        String sqlStatement = "INSERT INTO session_list (session_id,user_id) VALUES (\"" + session_id + "\"," + user_id + ");";
        try {
            db_statement.execute(sqlStatement);
            return true;
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return false;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }
// Проверить наличие профиля пользователя по email в таблице "user"
    public boolean hasUserByEmail(String findEmail) {
        try {
            String sqlStatement = "SELECT COUNT(*) as count FROM user WHERE email = \"" + findEmail + "\";";
            ResultSet resultSet = db_statement.executeQuery(sqlStatement);
            boolean count = false;
            while (resultSet.next()) {
                count = resultSet.getBoolean("count");
            }
            return count;
        } catch(SQLException e) {
            System.out.println(e.getMessage());
            return false;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }
// Проверить наличие сессии по session_hashCode в таблице "session_list"
    public boolean hasUserBySessionHashCode(String findSession_id) {
        try {
            String sqlStatement = "SELECT COUNT(*) as count FROM session_list WHERE session_id = \"" + findSession_id + "\";";
            ResultSet resultSet = db_statement.executeQuery(sqlStatement);
            Boolean count = false;
            while (resultSet.next()) {
                count = resultSet.getBoolean("count");
            }
            return count;
        } catch(SQLException e) {
            System.out.println(e.getMessage());
            return false;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }
// Получить профиль пользователя по email из таблицы "user"
    public UserProfile getUserByEmail(String findEmail) {
        try {
            String sqlStatement = "SELECT * FROM user WHERE email = \"" + findEmail + "\";";
            ResultSet resultSet = db_statement.executeQuery(sqlStatement);
            Long id = 0l;
            String login = "Guest";
            String email = "";
            String password = "";
            Long score = 0L;
            while (resultSet.next()) {
                id = resultSet.getLong("id");
                login = resultSet.getString("login");
                email = resultSet.getString("email");
                password = resultSet.getString("password");
                score = resultSet.getLong("score");
            }
            return new UserProfile(id,login,email,password,score);
        } catch(SQLException e) {
            System.out.println(e.getMessage());
            return null;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return null;
        }
    }
// Получить профиль пользователя по session_hashCode из таблицы "session_list"
    public UserProfile getUserBySessionHashCode(String findSession_id) {
        try {
            String sqlStatement = "SELECT user.id, user.login, user.email, user.password, user.score FROM user " +
                                    "JOIN session_list ON user.id = session_list.user_id " +
                                    "WHERE session_list.session_id = \"" + findSession_id + "\";";
            ResultSet resultSet = db_statement.executeQuery(sqlStatement);
            Long id = 0l;
            String login = "Guest";
            String email = "";
            String password = "";
            Long score = 0L;
            while (resultSet.next()) {
                id = resultSet.getLong("id");
                login = resultSet.getString("login");
                email = resultSet.getString("email");
                password = resultSet.getString("password");
                score = resultSet.getLong("score");
            }
            return new UserProfile(id,login,email,password,score);
        } catch(SQLException e) {
            System.out.println(e.getMessage());
            return null;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return null;
        }
    }
// Удалить запись из таблицы "session_list" по session_hashCode
    public boolean removeSessionFromSessionList(String session_id) {
        try {
            String sqlStatement = "DELETE FROM session_list " +
                                    "WHERE session_id = \"" + session_id + "\";";
            db_statement.execute(sqlStatement);
            return true;
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return false;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }
// Получить количество записей в таблице "user"
    public Integer getCountUser() {
        try {
            String sqlStatement = "SELECT COUNT(*) as count FROM user;";
            ResultSet resultSet = db_statement.executeQuery(sqlStatement);
            Integer count = null;
            while (resultSet.next()) {
                count = resultSet.getInt("count");
            }
            return count;
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return 0;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return 0;
        }
    }
// Получить количество записей в таблице "session_list"
    public Integer getCountSessionList() {
        try {
            String sqlStatement = "SELECT COUNT(*) as count FROM session_list;";
            ResultSet resultSet = db_statement.executeQuery(sqlStatement);
            Integer count = null;
            while (resultSet.next()) {
                count = resultSet.getInt("count");
            }
            return count;
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return 0;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return 0;
        }
    }
// Получить TOP 10
    public ArrayList<UserProfile> getTop10() {
        try {
            String sqlStatement = "SELECT * FROM user " +
                                    "ORDER BY -score " +
                                    "LIMIT 10;";
            ResultSet resultSet = db_statement.executeQuery(sqlStatement);
            ArrayList<UserProfile> users = new ArrayList<>();
            while (resultSet.next()) {
                Long id = resultSet.getLong("id");
                String login = resultSet.getString("login");
                String email = resultSet.getString("email");
                String password = resultSet.getString("password");
                Long score = resultSet.getLong("score");
                users.add(new UserProfile(id,login,email,password,score));
            }
            return users;
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return null;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return null;
        }
    }



    // Удалить пользователя из user по email. Нужно для тестов.
    public boolean deleteUserFromUser(String email) {
        try {
            String sqlStatement = "DELETE FROM user " +
                    "WHERE email = \"" + email+ "\";";
            db_statement.execute(sqlStatement);
            return true;
        } catch (SQLException e) {
            System.out.println(e.getMessage());
            return false;
        } catch (NullPointerException e) {
            System.out.println(e.getMessage());
            return false;
        }
    }
}
