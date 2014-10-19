package account_service;

//import junit.framework.TestCase;
import backend.AccountServiceImpl;
import org.junit.Assert;
import org.junit.Test;

public class AccountServiceImplTest {

    AccountServiceImpl service = new AccountServiceImpl();


    //@Category(AccountService.class)
    @Test
    public void testIntialRegisterUser() throws Exception {
        Assert.assertEquals("Fail to initialzie admin. One admin expected in numberOfRegisterUser",
                1, (int)service.numberOfRegisteredUsers());
    }
}