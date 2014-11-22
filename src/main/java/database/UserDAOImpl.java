package database;

import com.sun.istack.internal.Nullable;

import java.sql.Connection;
import java.sql.ResultSet;
import java.util.ArrayList;

public class UserDAOImpl implements UserDAO {

    private Connection db_connection;

    public UserDAOImpl(Connection db_connection) {
        this.db_connection = db_connection;
    }

    @Override
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

    @Override
    public void add(UserDataSet user) throws Exception {
        String sqlStatement;
        if(user.getEmail().equals("admin@admin.ru"))
            sqlStatement = "INSERT INTO user (id,login,email,password,score) VALUES (\"" + user.getId() + "\",\"" + user.getLogin() + "\",\"" + user.getEmail() + "\",\"" + user.getPassword() + "\"," + user.getScore() + ");";
        else
            sqlStatement = "INSERT INTO user (login,email,password,score) VALUES (\"" + user.getLogin() + "\",\"" + user.getEmail() + "\",\"" + user.getPassword() + "\"," + user.getScore() + ");";
        DBExecutor.execUpdate(db_connection, sqlStatement);
    }


    @Override
    public Boolean isExistsByEmail(String findEmail) throws Exception {
        String sqlStatement = "SELECT COUNT(*) as count FROM user WHERE email = \"" + findEmail + "\";";
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
    @Nullable
    public UserDataSet getByEmail(String findEmail) throws Exception {
        String sqlStatement = "SELECT * FROM user WHERE email = \"" + findEmail + "\";";
        return DBExecutor.execQuery(db_connection, sqlStatement, new ResultHandler<UserDataSet>() {
            @Override
            public UserDataSet handle(ResultSet result) throws Exception {
                if (result.first()) {
                    Long id = result.getLong("id");
                    String login = result.getString("login");
                    String email = result.getString("email");
                    String password = result.getString("password");
                    Long score = result.getLong("score");
                    return new UserDataSet(id,login,email,password,score);
                }
                else {
                    return null;
                }
            }
        });
    }

    @Override
    @Nullable
    public UserDataSet getBySessionId(String findSession_id) throws Exception {
        String sqlStatement = "SELECT user.id, user.login, user.email, user.password, user.score FROM user " +
                "JOIN session ON user.id = session.user_id " +
                "WHERE session.id = \"" + findSession_id + "\";";
        return DBExecutor.execQuery(db_connection, sqlStatement, new ResultHandler<UserDataSet>() {
            @Override
            public UserDataSet handle(ResultSet result) throws Exception {
                if (result.first()) {
                    Long id = result.getLong("id");
                    String login = result.getString("login");
                    String email = result.getString("email");
                    String password = result.getString("password");
                    Long score = result.getLong("score");
                    return new UserDataSet(id,login,email,password,score);
                }
                else {
                    return null;
                }
            }
        });
    }

    @Override
    public Integer getNumber() throws Exception {
        String sqlStatement = "SELECT COUNT(*) as count FROM user;";
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
    public ArrayList<UserDataSet> getTop10() throws Exception {
        String sqlStatement = "SELECT * FROM user " +
                "ORDER BY -score " +
                "LIMIT 10;";
        return DBExecutor.execQuery(db_connection, sqlStatement, new ResultHandler<ArrayList<UserDataSet>>() {
            @Override
            public ArrayList<UserDataSet> handle(ResultSet result) throws Exception {
                ArrayList<UserDataSet> users = new ArrayList<>();
                while (result.next()) {
                    Long id = result.getLong("id");
                    String login = result.getString("login");
                    String email = result.getString("email");
                    String password = result.getString("password");
                    Long score = result.getLong("score");
                    users.add(new UserDataSet(id,login,email,password,score));
                }
                return users;
            }
        });
    }

    @Override
    public void delete(String email) throws Exception {
        String sqlStatement = "DELETE FROM user " +
                "WHERE email = \"" + email+ "\";";
        DBExecutor.execUpdate(db_connection, sqlStatement);
    }
}
