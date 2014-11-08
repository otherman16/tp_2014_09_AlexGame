package database;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class DBExecutor {
    public int execUpdate(Connection connection, String update){
        Statement stmt = null;
        try {
            stmt = connection.createStatement();
            stmt.execute(update);
            return stmt.getUpdateCount();
        }
        catch (Exception e) {
            System.out.println("Exception in DBExecutor.execUpdate: " + e.getMessage());
            return 0;
        }
        finally {
            try {
                if (stmt != null) {
                    stmt.close();
                }
            }
            catch (Exception e) {
                System.out.println("Exception in DBExecutor.execUpdate: " + e.getMessage());
            }
        }
    }
    public<T> T execQuery(Connection connection, String query, ResultHandler<T> handler) {
        Statement stmt = null;
        ResultSet result = null;
        try {
            stmt = connection.createStatement();
            stmt.execute(query);
            result = stmt.getResultSet();
            return handler.handle(result);
        }
        catch (Exception e) {
            System.out.println("Exception in DBExecutor.execQuery: " + e.getMessage());
        }
        finally {
            try {
                if (result != null) {
                    result.close();
                }
                if (stmt != null) {
                    stmt.close();
                }
            }
            catch (Exception e) {
                System.out.println("Exception in DBExecutor.execQuery: " + e.getMessage());
            }
        }
    }
}
