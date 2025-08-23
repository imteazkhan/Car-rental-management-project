<?php
// Test admin endpoint without authentication for debugging
header("Content-Type: application/json");

try {
    // Test basic database connection
    require_once 'config/database.php';
    
    if (!$conn) {
        echo json_encode(['error' => 'Database connection failed']);
        exit;
    }
    
    // Test admin API class
    require_once 'BaseAPI.php';
    
    class TestAdmin extends BaseAPI {
        public function testConnection() {
            try {
                $query = "SELECT COUNT(*) as count FROM users WHERE role = 'admin'";
                if ($this->use_pdo) {
                    $stmt = $this->conn->prepare($query);
                    $stmt->execute();
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                } else {
                    $result = $this->conn->query($query);
                    if ($result) {
                        $row = $result->fetch_assoc();
                        $result = ['count' => $row['count']];
                    } else {
                        throw new Exception("Query failed: " . $this->conn->error);
                    }
                }
                
                return $result;
            } catch (Exception $e) {
                throw new Exception("Database test failed: " . $e->getMessage());
            }
        }
        
        public function testStatsQuery() {
            try {
                // Simple test query for stats
                $query = "SELECT COUNT(*) as total_users FROM users";
                if ($this->use_pdo) {
                    $stmt = $this->conn->prepare($query);
                    $stmt->execute();
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                } else {
                    $result = $this->conn->query($query);
                    if ($result) {
                        $row = $result->fetch_assoc();
                        $result = ['total_users' => $row['total_users']];
                    } else {
                        throw new Exception("Query failed: " . $this->conn->error);
                    }
                }
                
                return $result;
            } catch (Exception $e) {
                throw new Exception("Stats query failed: " . $e->getMessage());
            }
        }
    }
    
    $test = new TestAdmin();
    
    $response = [
        'success' => true,
        'message' => 'Admin API test successful',
        'database_type' => $test->use_pdo ? 'PDO' : 'MySQLi',
        'connection_test' => $test->testConnection(),
        'stats_test' => $test->testStatsQuery()
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>