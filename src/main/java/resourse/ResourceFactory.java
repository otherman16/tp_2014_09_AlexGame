package resourse;

import java.util.concurrent.ConcurrentHashMap;

public class ResourceFactory {
    private static volatile ResourceFactory resourceFactory = null;

    private ConcurrentHashMap <String, Resource> resources = null;

    private ResourceFactory(){
        resources = new ConcurrentHashMap<>();
    }

    public static ResourceFactory instance() {
        ResourceFactory localResourceFactory = resourceFactory;
        if (resourceFactory == null) {
            synchronized (ResourceFactory.class) {
                localResourceFactory = resourceFactory;
                if (localResourceFactory == null ) {
                    resourceFactory = localResourceFactory = new ResourceFactory();
                }
            }
        }
        return localResourceFactory;
    }

    public synchronized Resource get(String path) {
        if (resources.containsKey(path)) {
            return resources.get(path);
        }
        Resource newResource = (Resource)ReadXMLFileSAX.readXML(path);
        resources.put(path, newResource);
        return newResource;
    }
}