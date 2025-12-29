// Test file with hardcoded paths to verify the analysis works
public class TestHardcodedPaths {

    // Hardcoded paths that should be detected and replaced
    private static final String USER_HOME = "${USER_HOME:-$HOME}";
    private static final String PROJECT_ROOT = "${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}";
    private static final String SYSTEM_PATH = "/usr/local/bin";
    private static final String CONFIG_FILE = "/etc/myapp/config.properties";

    public void testPaths() {
        // These should be flagged by the analysis
        String userConfig = USER_HOME + "/.config/app.properties";
        String projectFile = PROJECT_ROOT + "/src/main/java/App.java";
        String systemTool = SYSTEM_PATH + "/mytool";

        System.out.println("Config: " + userConfig);
        System.out.println("Project: " + projectFile);
        System.out.println("Tool: " + systemTool);
    }
}