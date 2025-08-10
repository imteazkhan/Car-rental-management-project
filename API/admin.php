<?php
require_once 'BaseAPI.php';

class AdminAPI extends BaseAPI {
    
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
    
    // Get dashboard statistics
    public function getDashboardStats() {
        $this->verifyAdmin();
        
        // Total cars
        $cars_query = "SELECT COUNT(*) as total, 
                       SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                       SUM(CASE WHEN status = 'rented' THEN 1 ELSE 0 END) as rented,
                       SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance
                       FROM cars";
        $cars_stmt = $this->conn->prepare($cars_query);
        $cars_stmt->execute();
        $cars_stats = $cars_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Total users
        $users_query = "SELECT COUNT(*) as total,
                        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
                        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
                        FROM users";
        $users_stmt = $this->conn->prepare($users_query);
        $users_stmt->execute();
        $users_stats = $users_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Bookings statistics
        $bookings_query = "SELECT COUNT(*) as total,
                          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                          FROM bookings";
        $bookings_stmt = $this->conn->prepare($bookings_query);
        $bookings_stmt->execute();
        $bookings_stats = $bookings_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Revenue statistics
        $revenue_query = "SELECT 
                         SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
                         SUM(CASE WHEN p.status = 'completed' AND DATE(p.payment_date) = CURDATE() THEN p.amount ELSE 0 END) as today_revenue,
                         SUM(CASE WHEN p.status = 'completed' AND YEARWEEK(p.payment_date) = YEARWEEK(NOW()) THEN p.amount ELSE 0 END) as week_revenue,
                         SUM(CASE WHEN p.status = 'completed' AND MONTH(p.payment_date) = MONTH(NOW()) AND YEAR(p.payment_date) = YEAR(NOW()) THEN p.amount ELSE 0 END) as month_revenue
                         FROM payments p";
        $revenue_stmt = $this->conn->prepare($revenue_query);
        $revenue_stmt->execute();
        $revenue_stats = $revenue_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Recent bookings
        $recent_bookings_query = "SELECT b.id, b.start_date, b.end_date, b.status, b.total_amount,
                                 u.first_name, u.last_name, c.make, c.model, c.year
                                 FROM bookings b
                                 JOIN users u ON b.user_id = u.id
                                 JOIN cars c ON b.car_id = c.id
                                 ORDER BY b.created_at DESC
                                 LIMIT 5";
        $recent_bookings_stmt = $this->conn->prepare($recent_bookings_query);
        $recent_bookings_stmt->execute();
        $recent_bookings = $recent_bookings_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendSuccess([
            'cars' => $cars_stats,
            'users' => $users_stats,
            'bookings' => $bookings_stats,
            'revenue' => $revenue_stats,
            'recent_bookings' => $recent_bookings
        ]);
    }
    
    // Get monthly revenue chart data
    public function getRevenueChart() {
        $this->verifyAdmin();
        
        $year = $_GET['year'] ?? date('Y');
        
        $query = "SELECT 
                  MONTH(p.payment_date) as month,
                  SUM(p.amount) as revenue,
                  COUNT(p.id) as transactions
                  FROM payments p 
                  WHERE p.status = 'completed' AND YEAR(p.payment_date) = :year
                  GROUP BY MONTH(p.payment_date)
                  ORDER BY MONTH(p.payment_date)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':year', $year);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fill missing months with zero values
        $months = [];
        for ($i = 1; $i <= 12; $i++) {
            $months[$i] = ['month' => $i, 'revenue' => 0, 'transactions' => 0];
        }
        
        foreach ($data as $row) {
            $months[$row['month']] = $row;
        }
        
        $this->sendSuccess(array_values($months));
    }
    
    // Get car utilization data
    public function getCarUtilization() {
        $this->verifyAdmin();
        
        $query = "SELECT c.id, c.make, c.model, c.year, c.license_plate,
                  COUNT(b.id) as total_bookings,
                  SUM(CASE WHEN b.status = 'completed' THEN DATEDIFF(b.end_date, b.start_date) ELSE 0 END) as total_days_rented,
                  AVG(CASE WHEN r.rating IS NOT NULL THEN r.rating ELSE 0 END) as avg_rating
                  FROM cars c
                  LEFT JOIN bookings b ON c.id = b.car_id
                  LEFT JOIN reviews r ON c.id = r.car_id
                  GROUP BY c.id
                  ORDER BY total_bookings DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendSuccess($data);
    }
    
    // Manage user roles
    public function updateUserRole($user_id) {
        $this->verifyAdmin();
        
        $data = $this->getRequestData();
        
        if (!isset($data['role']) || !in_array($data['role'], ['customer', 'admin'])) {
            $this->sendError('Valid role required (customer or admin)', 400);
        }
        
        $query = "UPDATE users SET role = :role WHERE id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role', $data['role']);
        $stmt->bindParam(':user_id', $user_id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            $this->sendSuccess(null, 'User role updated successfully');
        } else {
            $this->sendError('User not found or update failed', 404);
        }
    }
    
    // Get all users with pagination
    public function getAllUsers() {
        $this->verifyAdmin();
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 20;
        $search = $_GET['search'] ?? null;
        $role = $_GET['role'] ?? null;
        
        $query = "SELECT id, username, email, first_name, last_name, phone, role, created_at
                  FROM users WHERE 1=1";
        $params = [];
        
        if ($search) {
            $query .= " AND (first_name LIKE :search OR last_name LIKE :search OR email LIKE :search OR username LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        if ($role) {
            $query .= " AND role = :role";
            $params[':role'] = $role;
        }
        
        $query .= " ORDER BY created_at DESC";
        
        // Get total count
        $count_query = str_replace("SELECT id, username, email, first_name, last_name, phone, role, created_at", "SELECT COUNT(*)", $query);
        $count_stmt = $this->conn->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetchColumn();
        
        // Add pagination
        $query = $this->paginate($query, $page, $limit);
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendSuccess([
            'users' => $users,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    // Add maintenance record
    public function addMaintenanceRecord() {
        $this->verifyAdmin();
        
        $data = $this->getRequestData();
        
        $this->validateRequired($data, ['car_id', 'maintenance_type', 'maintenance_date']);
        
        $data = $this->sanitizeInput($data);
        
        $query = "INSERT INTO maintenance_records (car_id, maintenance_type, description, cost, maintenance_date, next_maintenance_date)
                  VALUES (:car_id, :maintenance_type, :description, :cost, :maintenance_date, :next_maintenance_date)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':car_id', $data['car_id']);
        $stmt->bindParam(':maintenance_type', $data['maintenance_type']);
        $stmt->bindParam(':description', $data['description'] ?? null);
        $stmt->bindParam(':cost', $data['cost'] ?? null);
        $stmt->bindParam(':maintenance_date', $data['maintenance_date']);
        $stmt->bindParam(':next_maintenance_date', $data['next_maintenance_date'] ?? null);
        
        if ($stmt->execute()) {
            // Update car status to maintenance if specified
            if (isset($data['set_maintenance_status']) && $data['set_maintenance_status']) {
                $car_update = "UPDATE cars SET status = 'maintenance' WHERE id = :car_id";
                $car_stmt = $this->conn->prepare($car_update);
                $car_stmt->bindParam(':car_id', $data['car_id']);
                $car_stmt->execute();
            }
            
            $record_id = $this->conn->lastInsertId();
            $this->sendSuccess(['record_id' => $record_id], 'Maintenance record added successfully');
        } else {
            $this->sendError('Failed to add maintenance record', 500);
        }
    }
}

// Handle API requests
$admin = new AdminAPI();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'stats':
                    $admin->getDashboardStats();
                    break;
                case 'revenue-chart':
                    $admin->getRevenueChart();
                    break;
                case 'car-utilization':
                    $admin->getCarUtilization();
                    break;
                case 'users':
                    $admin->getAllUsers();
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Action not found']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Action required']);
        }
        break;
        
    case 'POST':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'maintenance':
                    $admin->addMaintenanceRecord();
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Action not found']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Action required']);
        }
        break;
        
    case 'PUT':
        if (isset($_GET['action']) && $_GET['action'] === 'user-role' && isset($_GET['user_id'])) {
            $admin->updateUserRole($_GET['user_id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
