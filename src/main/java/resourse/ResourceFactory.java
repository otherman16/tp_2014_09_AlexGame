package resourse;

import java.util.HashMap;

public class ResourceFactory {
    private static ResourceFactory resourceFactory = null;

    private HashMap<String, Resource> resources = null;

    private ResourceFactory(){
        resources = new HashMap<>();
    }

    public static ResourceFactory instance() {
        if (resourceFactory == null) {
            return new ResourceFactory();
        }
        return resourceFactory;
    }

    public Resource get(String path) {
        if (resources.containsKey(path)) {
            return resources.get(path);
        }
        Resource newResource = (Resource)ReadXMLFileSAX.readXML(path);
        resources.put(path, newResource);
        return newResource;
    }
}
