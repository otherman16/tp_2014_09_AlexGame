package messageSystem;

import backend.AccountServiceImpl;
import base.AccountService;
import base.GameMechanics;
import mechanics.GameMechanicsImpl;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class AddressService {

    private Address gameMechanics;
    private List<Address> accountServiceList = new ArrayList<>();

    private AtomicInteger accountServiceCounter = new AtomicInteger();

    public void registerGameMechanics(GameMechanicsImpl gameMechanics) {
        this.gameMechanics = gameMechanics.getAddress();
    }

    public void registerAccountService(AccountServiceImpl accountService) {
        accountServiceList.add(accountService.getAddress());
    }

    public Address getGameMechanicsAddress() {
        return gameMechanics;
    }

    public synchronized Address getAccountServiceAddress() {
        int index = accountServiceCounter.getAndIncrement();
        if (index >= accountServiceList.size()) {
            index = 0;
        }
        return accountServiceList.get(index);
    }
}
