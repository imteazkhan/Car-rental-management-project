<?php
// Test database connection and table existence
require_once 'database/config.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "✅ Database connection successful!\n\n";
    
    // Check if database exists and tables are created
    $tables = ['users', 'car_categories', 'cars', 'bookings', 'payments', 'reviews', 'maintenance_records'];
    
    foreach ($tables as $table) {
        $query = "SHOW TABLES LIKE '$table'";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table' exists\n";
            
            // Check if table has data
            $count_query = "SELECT COUNT(*) as count FROM $table";
            $count_stmt = $conn->prepare($count_query);
            $count_stmt->execute();
            $count = $count_stmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "   - Records: $count\n";
        } else {
            echo "❌ Table '$table' does NOT exist\n";
        }
    }
    
    echo "\n--- Database Info ---\n";
    $db_query = "SELECT DATABASE() as db_name";
    $db_stmt = $conn->prepare($db_query);
    $db_stmt->execute();
    $db_info = $db_stmt->fetch(PDO::FETCH_ASSOC);
    echo "Current database: " . $db_info['db_name'] . "\n";
    
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    echo "Please check:\n";
    echo "1. XAMPP is running\n";
    echo "2. MySQL service is started\n";
    echo "3. Database 'car_rental' exists\n";
}
?>
