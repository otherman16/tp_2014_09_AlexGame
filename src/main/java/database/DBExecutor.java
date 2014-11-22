package database;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class DBExecutor {
    public static int execUpdate(Connection connection, String update) throws Exception {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(update);
            return stmt.getUpdateCount();
        }
    }
    public static <T> T execQuery(Connection connection, String query, ResultHandler<T> handler) throws Exception {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(query);
            try (ResultSet result = stmt.getResultSet()) {
                return  handler.handle(result);
            }
        }
    }
}
