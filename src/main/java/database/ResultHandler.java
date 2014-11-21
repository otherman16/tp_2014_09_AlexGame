package database;

import java.sql.ResultSet;

public interface ResultHandler<T> {
    T handle(ResultSet result) throws Exception;
}
