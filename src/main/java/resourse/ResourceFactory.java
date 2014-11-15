package resourse;

import sun.misc.REException;

import javax.annotation.Resource;

/**
 * Created by aleksei on 15.11.14.
 */
public class ResourceFactory {

    private static StartPort startPort = null;
    private static Puck puck = null;

    private static ResourceFactory resourceFactory = null;
    public static ResourceFactory getInstance() {
        if (resourceFactory == null)
            resourceFactory = new ResourceFactory();
        return resourceFactory;
    }

    public StartPort get (String path) {
        return (StartPort)(ReadXMLFileSAX.readXML(path));
    }

    public Puck getPuck (String path ) {
       return (Puck)(ReadXMLFileSAX.readXML(path));
    }
}
