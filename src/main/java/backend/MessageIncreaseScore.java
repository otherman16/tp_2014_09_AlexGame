package backend;

import messageSystem.Address;

public final class MessageIncreaseScore extends MessageToAccountService {

    private String email;
    private int scoreToIncrease;

    public MessageIncreaseScore(Address from, Address to, String email, int score) {
        super(from, to);
        this.email = email;
        this.scoreToIncrease = score;
    }

    @Override
    protected void exec(AccountServiceImpl service) {
        service.increaseScore(email, scoreToIncrease);
    }
}
