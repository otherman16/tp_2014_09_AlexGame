package resourse;

import org.junit.Assert;
import org.junit.Test;

public class ResourceTest {


    @Test
    public void loadPortOk() {
        StartPort startPort = (StartPort)ResourceFactory.instance().get("./data/startPort.xml");
        Assert.assertEquals(startPort.getPort(), 8096);
    }

    @Test
    public void loadPortFail() {
        StartPort startPort = (StartPort)ResourceFactory.instance().get("./data/startPort.xml");
        Assert.assertNotEquals(startPort.getPort(), 8080);
    }

    @Test
    public void loadDBParametersOk() {
        DataBase dataBase = (DataBase) ResourceFactory.instance().get("./data/dataBase.xml");
        Assert.assertEquals(dataBase.getPort(), "3306");
        Assert.assertEquals(dataBase.getName(), "alexgame_user");
        Assert.assertEquals(dataBase.getUser(), "g06_alexgame_db");
        Assert.assertEquals(dataBase.getPassword(), "alexgame_user");
    }
    @Test
    public void loadDBParametersFail() {
        DataBase dataBase = (DataBase) ResourceFactory.instance().get("./data/dataBase.xml");
        Assert.assertNotEquals(dataBase.getPort(), "x_3306");
        Assert.assertNotEquals(dataBase.getName(), "x_g06_alexgame_db");
        Assert.assertNotEquals(dataBase.getUser(), "x_alexgame_user");
        Assert.assertNotEquals(dataBase.getPassword(), "x_alexgame_user");
    }
}