<?php
/**
 * Environment Variables Loader
 * Kanban Board Project - Web Programming 10636316
 * 
 * Simple .env file loader for PHP
 */

class EnvLoader {
    private static $loaded = false;
    private static $variables = [];

    /**
     * Load environment variables from .env file
     * @param string $path Path to .env file
     * @return bool True if loaded successfully
     */
    public static function load($path = null) {
        if (self::$loaded) {
            return true;
        }

        if ($path === null) {
            $path = __DIR__ . '/../.env';
        }

        if (!file_exists($path)) {
            error_log("Warning: .env file not found at: " . $path);
            return false;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            // Parse key=value pairs
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                // Remove quotes if present
                if (preg_match('/^"(.*)"$/', $value, $matches)) {
                    $value = $matches[1];
                } elseif (preg_match("/^'(.*)'$/", $value, $matches)) {
                    $value = $matches[1];
                }

                // Store in both $_ENV and our internal array
                $_ENV[$key] = $value;
                self::$variables[$key] = $value;
                
                // Also set as environment variable if not already set
                if (!getenv($key)) {
                    putenv("$key=$value");
                }
            }
        }

        self::$loaded = true;
        return true;
    }

    /**
     * Get environment variable value
     * @param string $key Variable name
     * @param mixed $default Default value if not found
     * @return mixed Variable value or default
     */
    public static function get($key, $default = null) {
        self::load(); // Ensure loaded

        // Check $_ENV first
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }

        // Check getenv()
        $value = getenv($key);
        if ($value !== false) {
            return $value;
        }

        // Check our internal array
        if (isset(self::$variables[$key])) {
            return self::$variables[$key];
        }

        return $default;
    }

    /**
     * Check if environment variable exists
     * @param string $key Variable name
     * @return bool True if exists
     */
    public static function has($key) {
        self::load();
        return isset($_ENV[$key]) || getenv($key) !== false || isset(self::$variables[$key]);
    }

    /**
     * Get all loaded environment variables
     * @return array All variables
     */
    public static function all() {
        self::load();
        return array_merge(self::$variables, $_ENV);
    }

    /**
     * Force reload environment variables
     * @param string $path Path to .env file
     * @return bool True if loaded successfully
     */
    public static function reload($path = null) {
        self::$loaded = false;
        self::$variables = [];
        return self::load($path);
    }
}

// Auto-load environment variables when this file is included
EnvLoader::load();

/**
 * Helper function to get environment variable
 * @param string $key Variable name
 * @param mixed $default Default value
 * @return mixed Variable value or default
 */
function env($key, $default = null) {
    return EnvLoader::get($key, $default);
}
?>
