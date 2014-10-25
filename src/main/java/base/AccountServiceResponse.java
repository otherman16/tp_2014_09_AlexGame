package base;

public class AccountServiceResponse<T> {
    private boolean status;
    private T response;

    public AccountServiceResponse(boolean status, T response) {
        this.status = status;
        this.response = response;
    }

    public boolean getStatus() {
        return status;
    }

    public void setStatus(boolean status) {
        this.status = status;
    }

    public Object getResponse() {
        return response;
    }

    public void setResponse(T response) {
        this.response = response;
    }
}
