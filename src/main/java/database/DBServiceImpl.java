package database;

import base.*;

import java.sql.*;
import java.util.ArrayList;

public class DBServiceImpl implements DBService{

    private UserDAO userDAO;
    private SessionListDAO sessionListDAO;

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
            Connection db_connection = DriverManager.getConnection(url.toString());
            userDAO = new UserDAOImpl(db_connection);
            sessionListDAO = new SessionListDAOImpl(db_connection);
            userDAO.createTable();
            sessionListDAO.createTable();
        } catch (Exception e) {
            System.out.println("Exception in DBServiceImpl.DBServiceImpl: " + e.getMessage());
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
                    System.out.println("Exception in DBServiceImpl.createDBAndUser: " + e.getMessage());
                }
            }
            if (root_db_connection != null) {
                try {
                    root_db_connection.close();
                } catch (Exception e) {
                    System.out.println("Exception in DBServiceImpl.createDBAndUser: " + e.getMessage());
                }
            }
        }
    }

    public void addUser(UserProfile user) throws Exception {
        userDAO.add(new UserDataSet(user.getId(),user.getEmail(),user.getLogin(),user.getPassword(),user.getScore()));
    }

    public void addSession(String session_id, Long user_id) throws Exception {
        sessionListDAO.add(session_id, user_id);
    }

    public Boolean isUserExistsByEmail(String findEmail) throws Exception {
        return userDAO.isExistsByEmail(findEmail);
    }

    public Boolean isSessionExistsBySessionId(String findSession_id) throws Exception {
        return sessionListDAO.isExistsBySessionId(findSession_id);
    }

    public UserProfile getUserByEmail(String findEmail) throws Exception {
        UserDataSet user = userDAO.getByEmail(findEmail);
        return new UserProfile(user.getId(), user.getLogin(), user.getEmail(), user.getPassword(), user.getScore());
    }

    public UserProfile getUserBySessionId(String findSession_id) throws Exception {
        UserDataSet user = userDAO.getBySessionId(findSession_id);
        return new UserProfile(user.getId(), user.getLogin(), user.getEmail(), user.getPassword(), user.getScore());
    }

    public void deleteSession(String session_id) throws Exception {
        sessionListDAO.delete(session_id);
    }

    public Integer getCountUser() throws Exception {
        return userDAO.getNumber();
    }

    public Integer getCountSessionList() throws Exception {
        return sessionListDAO.getNumber();
    }

    public ArrayList<UserProfile> getTop10() throws Exception {
        ArrayList<UserDataSet> userDataSets = userDAO.getTop10();
        ArrayList<UserProfile> userProfiles = new ArrayList<>();
        for (UserDataSet userDataSet : userDataSets) {
            userProfiles.add(new UserProfile(userDataSet.getId(), userDataSet.getLogin(), userDataSet.getEmail(), userDataSet.getPassword(), userDataSet.getScore()));
        }
        return userProfiles;
    }

    public void deleteUser(String email) throws Exception {
        userDAO.delete(email);
    }
}
