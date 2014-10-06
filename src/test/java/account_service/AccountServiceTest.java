package account_service;

//import junit.framework.TestCase;
import org.junit.Assert;
import org.junit.Test;
import org.junit.Ignore;
import org.junit.experimental.categories.Category;

import static org.junit.Assert.*;

public class AccountServiceTest {

    AccountService service = new AccountService();


    //@Category(AccountService.class)
    @Test
    public void testIntialRegisterUser() throws Exception {
        Assert.assertEquals("Fail to initialzie admin. One admin expected in numberOfRegisterUser",
                1, (int)service.numberOfRegisteredUsers());
    }
}