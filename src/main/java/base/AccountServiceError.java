package base;

import java.util.HashMap;

public class AccountServiceError {

    private String code;

    private HashMap<String, String> errors;

    public AccountServiceError(String code) {
        errors = new HashMap<>();
        errors.put("ServerError", "Internal server error");
        errors.put("WrongEmailError", "User with those email is not exist");
        errors.put("WrongPasswordError", "Wrong password");
        errors.put("NotAuthError", "User is not authenticated");
        errors.put("IsAuthError", "User is already authenticated");
        errors.put("UserExistsError", "User with those email is already exists");
        if (errors.containsKey(code)) {
            this.code = code;
        }
        else {
            this.code = "ServerError";
        }
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return errors.get(code);
    }
}