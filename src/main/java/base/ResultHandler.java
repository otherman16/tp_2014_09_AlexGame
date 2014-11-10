package base;

import java.sql.ResultSet;

public interface ResultHandler<T> {
    public T handle(ResultSet result) throws Exception;
}
