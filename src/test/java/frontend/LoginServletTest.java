package frontend;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.htmlunit.HtmlUnitDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.WebDriverWait;

import junit.framework.TestCase;
import static org.junit.Assert.*;

public class LoginServletTest extends TestCase {
    public static void main(String[] args) throws Exception {
        // The Firefox driver supports javascript
        WebDriver driver = new HtmlUnitDriver();
      //Close the browser
        driver.quit();
    }

}