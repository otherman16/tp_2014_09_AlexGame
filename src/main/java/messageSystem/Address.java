package messageSystem;

import java.util.concurrent.atomic.AtomicInteger;

public class Address {
    private static final AtomicInteger abonentIdCreator = new AtomicInteger();
    private final int abonentId;

    public Address(){
        abonentId = abonentIdCreator.getAndIncrement();
    }

    @Override
    public int hashCode() {
        return abonentId;
    }
}
