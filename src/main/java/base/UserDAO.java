package base;

import database.UserDataSet;

import java.sql.Connection;
import java.util.ArrayList;

public interface UserDAO {

    public void createTable() throws Exception;

    public void add(UserDataSet user) throws Exception;

    public Boolean isExistsByEmail(String findEmail) throws Exception;

    public UserDataSet getByEmail(String findEmail) throws Exception;

    public UserDataSet getBySessionId(String findSession_id) throws Exception;

    public Integer getNumber() throws Exception;

    public ArrayList<UserDataSet> getTop10() throws Exception;

    public void delete(String email) throws Exception;
}
