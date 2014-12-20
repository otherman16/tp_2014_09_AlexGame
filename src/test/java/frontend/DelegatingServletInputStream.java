package frontend;

import javax.servlet.ServletInputStream;
import java.io.IOException;
import java.io.InputStream;

public class DelegatingServletInputStream extends ServletInputStream {

    private final InputStream sourceStream;


    /**
     * Create a DelegatingServletInputStream for the given source stream.
     * @param sourceStream the source stream (never <code>null</code>)
     */
    public DelegatingServletInputStream(InputStream sourceStream) {
        //Assert.notNull(sourceStream, "Source InputStream must not be null");
        this.sourceStream = sourceStream;
    }

    /**
     * Return the underlying source stream (never <code>null</code>).
     */
    public final InputStream getSourceStream() {
        return this.sourceStream;
    }


    public int read() throws IOException {
        return this.sourceStream.read();
    }

    public void close() throws IOException {
        super.close();
        this.sourceStream.close();
    }

    public boolean isReady() { return true; }
    public boolean isFinished() { return true; }

    public void setReadListener(javax.servlet.ReadListener readListener) {}

}
