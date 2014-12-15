package backend;

import messageSystem.Abonent;
import messageSystem.Address;
import messageSystem.Message;

public abstract class MessageToAccountService extends Message {
    public MessageToAccountService(Address from, Address to) {
        super(from, to);
    }

    @Override
    public final void exec(Abonent abonent) {
        if (abonent instanceof AccountServiceImpl) {
            exec((AccountServiceImpl) abonent);
        }
    }

    protected abstract void exec(AccountServiceImpl service);
}
