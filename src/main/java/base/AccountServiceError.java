package base;

public enum AccountServiceError {
    ServerError {
        public String getMessage() {
            return "Internal server error";
        }
    },
    WrongEmailError {
        public String getMessage() {
            return "User with those email is not exist";
        }
    },
    WrongPasswordError {
        public String getMessage() {
            return "Wrong password";
        }
    },
    NotAuthError {
        public String getMessage() {
            return "User is not authenticated";
        }
    },
    IsAuthError {
        public String getMessage() {
            return "User is already authenticated";
        }
    },
    UserExistsError {
        public String getMessage() {
            return "User with those email is already exists";
        }
    };

    public abstract String getMessage();
}