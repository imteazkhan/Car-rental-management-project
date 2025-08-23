<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'BaseAPI.php';

class DebugAdminAPI extends BaseAPI {
    
    // Test stats without authentication
    public function testStats() {
        try {
            // Total cars
            $cars_query = "SELECT COUNT(*) as total, 
                           SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                           SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented,
                           SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
                           FROM cars";
            
            if ($this->use_pdo) {
                $cars_stmt = $this->conn->prepare($cars_query);
                $cars_stmt->execute();
                $cars_stats = $cars_stmt->fetch(PDO::FETCH_ASSOC);
            } else {
                $cars_result = $this->conn->query($cars_query);
                $cars_stats = $cars_result ? $cars_result->fetch_assoc() : [];
            }
            
            // Total users
            $users_query = "SELECT COUNT(*) as total,
                            SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
                            SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
                            FROM users";
            
            if ($this->use_pdo) {
                $users_stmt = $this->conn->prepare($users_query);
                $users_stmt->execute();
                $users_stats = $users_stmt->fetch(PDO::FETCH_ASSOC);
            } else {
                $users_result = $this->conn->query($users_query);
                $users_stats = $users_result ? $users_result->fetch_assoc() : [];
            }
            
            // Bookings statistics
            $bookings_stats = ['total' => 0, 'pending' => 0, 'confirmed' => 0, 'active' => 0, 'completed' => 0, 'cancelled' => 0];
            $bookings_query = "SELECT COUNT(*) as total,
                              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                              SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                              SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                              FROM bookings";
            
            try {
                if ($this->use_pdo) {
                    $bookings_stmt = $this->conn->prepare($bookings_query);
                    $bookings_stmt->execute();
                    $bookings_result = $bookings_stmt->fetch(PDO::FETCH_ASSOC);
                    if ($bookings_result) {
                        $bookings_stats = $bookings_result;
                    }
                } else {
                    $bookings_result = $this->conn->query($bookings_query);
                    if ($bookings_result) {
                        $bookings_data = $bookings_result->fetch_assoc();
                        if ($bookings_data) {
                            $bookings_stats = $bookings_data;
                        }
                    }
                }
            } catch (Exception $e) {
                // Bookings table might not exist
            }
            
            $this->sendSuccess([
                'cars' => $cars_stats ?: ['total' => 0, 'available' => 0, 'rented' => 0, 'maintenance' => 0],
                'users' => $users_stats ?: ['total' => 0, 'customers' => 0, 'admins' => 0],
                'bookings' => $bookings_stats,
                'revenue' => ['total_revenue' => 0, 'today_revenue' => 0, 'week_revenue' => 0, 'month_revenue' => 0],
                'recent_bookings' => [],
                'debug_info' => [
                    'database_type' => $this->use_pdo ? 'PDO' : 'MySQLi',
                    'connection_status' => 'Connected'
                ]
            ]);
        } catch (Exception $e) {
            $this->sendError('Debug test failed: ' . $e->getMessage(), 500);
        }
    }
}

// Handle requests
$debug = new DebugAdminAPI();

if (isset($_GET['action']) && $_GET['action'] === 'test-stats') {
    $debug->testStats();
} else {
    echo json_encode([
        'success' => true,
        'message' => 'Debug admin API ready',
        'available_actions' => ['test-stats'],
        'usage' => 'Add ?action=test-stats to test dashboard stats'
    ]);
}
?>