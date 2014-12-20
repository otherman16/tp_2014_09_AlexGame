package backend;

import base.AccountService;
import base.DBService;
import database.DBServiceImpl;
import messageSystem.MessageSystem;
import org.junit.Assert;
import org.junit.Test;
import resourse.DataBase;
import resourse.ResourceFactory;

public class AServiceImplExtraTest {

    private MessageSystem ms = new MessageSystem();
    private AccountService service = new AccountServiceImpl(ms);

    DataBase dataBase = (DataBase) ResourceFactory.instance().get("./data/dataBase.xml");
    DBService dbService = new DBServiceImpl(dataBase.getHost(), dataBase.getPort(), dataBase.getUser(), dataBase.getName(), dataBase.getPassword());


    @Test
    public void testGetTop10() throws Exception {
        Assert.assertTrue("GetTop10", service.getTop10().getStatus());
    }

    @Test
    public void testIncreaseScore() throws Exception {
        String email = "admin@admin.ru";
        int initialScore = dbService.getUserByEmail(email).getScore().intValue();
        int scoreToIncrease = 10;
        service.increaseScore(email, scoreToIncrease);
        int resultScore = dbService.getUserByEmail(email).getScore().intValue();
        Assert.assertEquals(initialScore, resultScore - scoreToIncrease);
        service.increaseScore(email, -scoreToIncrease);
    }
}