package account_service;

/**
 * Created by aleksei on 05.10.14.
 */
import org.junit.Test;
import org.junit.experimental.categories.Categories;
import org.junit.runner.RunWith;
import org.junit.runners.Suite;

@RunWith(Categories.class)
//Categories — попытка организовать тесты в категории(группы).
//@Categories.IncludeCategory(AccountService.class)
@Suite.SuiteClasses( { AccountServiceAnotherTest.class, AccountServiceAuthTest.class })
public class AccountServiceTestSuite {
}
