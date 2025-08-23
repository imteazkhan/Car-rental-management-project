<?php
// Enable CORS for React frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../BaseAPI.php';

class OverviewAPI extends BaseAPI {
    
    // Verify admin access
    private function verifyAdmin() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        // Check if user is admin
        $query = "SELECT role FROM users WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $user_id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('User not found', 404);
        }
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user['role'] !== 'admin') {
            $this->sendError('Admin access required', 403);
        }
        
        return $user_id;
    }
    
    // Get dashboard overview
    public function getOverview() {
        $this->verifyAdmin();
        
        // Total users
        $users_query = "SELECT COUNT(*) as total_users FROM users WHERE role = 'customer'";
        $users_stmt = $this->conn->prepare($users_query);
        $users_stmt->execute();
        $total_users = $users_stmt->fetchColumn();
        
        // Total cars
        $cars_query = "SELECT COUNT(*) as total_cars FROM cars";
        $cars_stmt = $this->conn->prepare($cars_query);
        $cars_stmt->execute();
        $total_cars = $cars_stmt->fetchColumn();
        
        // Total bookings
        $bookings_query = "SELECT COUNT(*) as total_bookings FROM bookings";
        $bookings_stmt = $this->conn->prepare($bookings_query);
        $bookings_stmt->execute();
        $total_bookings = $bookings_stmt->fetchColumn();
        
        // Total revenue
        $revenue_query = "SELECT SUM(amount) as total_revenue FROM payments WHERE status = 'completed'";
        $revenue_stmt = $this->conn->prepare($revenue_query);
        $revenue_stmt->execute();
        $total_revenue = $revenue_stmt->fetchColumn() ?? 0;
        
        // Recent activity
        $activity_query = "
            (SELECT 'New Booking' as type, CONCAT(u.first_name, ' ', u.last_name, ' booked ', c.make, ' ', c.model) as description, 
             b.created_at as time, '#4361ee' as color, 'fas fa-calendar-plus' as icon
             FROM bookings b 
             JOIN users u ON b.user_id = u.id 
             JOIN cars c ON b.car_id = c.id 
             ORDER BY b.created_at DESC LIMIT 3)
            UNION
            (SELECT 'New User' as type, CONCAT(first_name, ' ', last_name, ' registered') as description, 
             created_at as time, '#4cc9f0' as color, 'fas fa-user-plus' as icon
             FROM users 
             WHERE role = 'customer'
             ORDER BY created_at DESC LIMIT 2)
            ORDER BY time DESC
            LIMIT 5
        ";
        
        $activity_stmt = $this->conn->prepare($activity_query);
        $activity_stmt->execute();
        $recent_activity = $activity_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format activity time
        foreach ($recent_activity as &$activity) {
            $time = new DateTime($activity['time']);
            $now = new DateTime();
            $interval = $now->diff($time);
            
            if ($interval->d > 0) {
                $activity['time'] = $interval->d . ' days ago';
            } elseif ($interval->h > 0) {
                $activity['time'] = $interval->h . ' hours ago';
            } elseif ($interval->i > 0) {
                $activity['time'] = $interval->i . ' minutes ago';
            } else {
                $activity['time'] = 'Just now';
            }
            
            $activity['text'] = $activity['description'];
        }
        
        $this->sendSuccess([
            'total_users' => (int)$total_users,
            'total_cars' => (int)$total_cars,
            'total_bookings' => (int)$total_bookings,
            'total_revenue' => (float)$total_revenue,
            'recent_activity' => $recent_activity
        ]);
    }
}

// Handle API requests
$overview = new OverviewAPI();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $overview->getOverview();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>