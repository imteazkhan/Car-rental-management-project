<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once 'config/database.php';
    
    // Create admin user if not exists
    $admin_email = 'admin@carrental.com';
    $admin_password = password_hash('admin123', PASSWORD_DEFAULT);
    
    // Check if admin exists
    $check_query = "SELECT id, email, role FROM users WHERE email = ? OR role = 'admin'";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bind_param("s", $admin_email);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Create admin user
        $insert_query = "INSERT INTO users (username, email, password, first_name, last_name, phone, role) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)";
        $insert_stmt = $conn->prepare($insert_query);
        $username = 'admin';
        $first_name = 'Admin';
        $last_name = 'User';
        $phone = '+1234567890';
        $role = 'admin';
        
        $insert_stmt->bind_param("sssssss", $username, $admin_email, $admin_password, $first_name, $last_name, $phone, $role);
        
        if ($insert_stmt->execute()) {
            $admin_id = $insert_stmt->insert_id;
            $message = "Admin user created successfully";
        } else {
            throw new Exception("Failed to create admin user: " . $insert_stmt->error);
        }
        $insert_stmt->close();
    } else {
        $admin = $result->fetch_assoc();
        $admin_id = $admin['id'];
        $message = "Admin user already exists";
    }
    $check_stmt->close();
    
    // Test basic queries that admin dashboard would use
    $stats = [];
    
    // Count users
    $user_query = "SELECT COUNT(*) as total, 
                   SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
                   SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
                   FROM users";
    $user_result = $conn->query($user_query);
    if ($user_result) {
        $stats['users'] = $user_result->fetch_assoc();
    }
    
    // Count cars
    $car_query = "SELECT COUNT(*) as total,
                  SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                  SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented,
                  SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
                  FROM cars";
    $car_result = $conn->query($car_query);
    if ($car_result) {
        $stats['cars'] = $car_result->fetch_assoc();
    }
    
    // Count bookings
    $booking_query = "SELECT COUNT(*) as total,
                      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                      FROM bookings";
    $booking_result = $conn->query($booking_query);
    if ($booking_result) {
        $stats['bookings'] = $booking_result->fetch_assoc();
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'admin_credentials' => [
            'email' => $admin_email,
            'password' => 'admin123',
            'note' => 'Use these credentials to login as admin'
        ],
        'database_stats' => $stats,
        'admin_dashboard_ready' => true
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}

$conn->close();
?>