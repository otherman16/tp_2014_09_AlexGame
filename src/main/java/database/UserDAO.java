package database;

import java.util.ArrayList;

public interface UserDAO {

    void createTable() throws Exception;

    void add(UserDataSet user) throws Exception;

    Boolean isExistsByEmail(String findEmail) throws Exception;

    UserDataSet getByEmail(String findEmail) throws Exception;

    UserDataSet getBySessionId(String findSession_id) throws Exception;

    Integer getNumber() throws Exception;

    ArrayList<UserDataSet> getTop10() throws Exception;

    void increaseScore(String findEmail, int scoreToIncrease) throws Exception;

    void delete(String email) throws Exception;
}
