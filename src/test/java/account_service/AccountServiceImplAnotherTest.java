package account_service;

import backend.AccountServiceImpl;
import base.UserProfile;
import junit.framework.TestCase;
import org.junit.*;
import org.mockito.Mockito;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.htmlunit.HtmlUnitDriver;

import javax.servlet.http.HttpSession;

public class AccountServiceImplAnotherTest extends TestCase {

    AccountServiceImpl service = new AccountServiceImpl();
    // mock - для того, чтобы имитировать сессию.
    HttpSession httpSession = Mockito.mock(HttpSession.class);

    String login = "test";
    String email = "test@test.ru";
    String pass = "test";
    UserProfile user = new UserProfile(login, email, pass);

    @Before
    public void setUp () {
        service.deleteUser(email);
    }

    @After
    public void tearDown() throws Exception {
        boolean result;
        try {
            if (service.deleteUser(email)) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        }
        Assert.assertTrue("delete user Error", result);
    }

    @Test
    public void testRegisterUserOk() throws Exception {
        boolean result;
        try {
            if ( service.registerUser(user, httpSession) ) {
                result = true;
            }
            else
                result = false;
        } catch (Exception e) {
            result = false;
        }
        Assert.assertTrue("registration Error", result);
    }

    @Test
    public void testRegisterUserFail() throws Exception {
        boolean result;
        try {
            service.registerUser(user, httpSession);
            if ( service.registerUser(user, httpSession) ) {
                result = false;
            }
            else
                result = true;
        } catch (Exception e) {
            result = true;
        }
        Assert.assertTrue("registration Error", result);
    }
    @Test
    public void TestDeleteFail() throws Exception{
        boolean result = false;
        service.registerUser(user, httpSession);
        try {
            service.deleteUser(user+"123");
        } catch (Exception e) {
            result = true;
        }
        Assert.assertTrue(result);
    }

    /**
     * Created by aleksei on 23.10.14.
     */
    public static class GladiolusSearch  {
        public static void main(String[] args) {
            // создаем новый экземпляр html unit driver
            // Обратите внимание, что последующий код не закладывается на
            // конкретную, имплементацию, а только на интерфейс WebDriver.
            WebDriver driver = new HtmlUnitDriver();

            // Открываем Google
            driver.get("http://www.google.com");

            // Находим по имени поле для ввода
            WebElement element = driver.findElement(By.name("q"));

            // Вводим ключевое слово для поиска
            element.sendKeys("гладиолус");

            // Отправляем форму в которой находится элемент element.
            // WebDriver сам найдет, в какой он форме.
            element.submit();

            // Выводим в консоль заголовок страницы
            System.out.println("Page title is: " + driver.getTitle());
        }
    }
}