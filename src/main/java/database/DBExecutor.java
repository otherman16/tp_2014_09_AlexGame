package database;

import base.ResultHandler;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class DBExecutor {
    public int execUpdate(Connection connection, String update) throws Exception {
        Statement stmt = connection.createStatement();
        stmt.execute(update);
        int count = stmt.getUpdateCount();
        stmt.close();
        return count;
    }
    public<T> T execQuery(Connection connection, String query, ResultHandler<T> handler) throws Exception {
        Statement stmt = connection.createStatement();
        stmt.execute(query);
        ResultSet result = stmt.getResultSet();
        T handlerResult = handler.handle(result);
        result.close();
        stmt.close();
        return handlerResult;
    }
}
