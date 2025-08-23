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

require_once 'config/database.php';
require_once 'BaseAPI.php';

class BookingsAPI extends BaseAPI {
    
    // Get user bookings
    public function getUserBookings() {
        $token = $this->getAuthHeader();
        
        if (!$token) {
            $this->sendError('Authorization token required', 401);
        }
        
        // Decode token to get user ID (compatible with admin.php format)
        $decoded = base64_decode($token);
        $parts = explode(':', $decoded);
        if (count($parts) < 2) {
            $this->sendError('Invalid token format. Expected format: user_id:email', 401);
        }
        $user_id = $parts[0];
        
        // Validate user_id is numeric
        if (!is_numeric($user_id)) {
            $this->sendError('Invalid user ID in token', 401);
        }
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $status = $_GET['status'] ?? null;
        
        if ($this->use_pdo) {
            $query = "SELECT b.*, c.make, c.model, c.year, c.image_url, c.daily_rate,
                      CONCAT(c.make, ' ', c.model) as car_name,
                      c.image_url as car_image,
                      DATEDIFF(b.end_date, b.start_date) as total_days,
                      c.daily_rate as price_per_day,
                      b.created_at as booking_date
                      FROM bookings b 
                      JOIN cars c ON b.car_id = c.id 
                      WHERE b.user_id = :user_id";
            $params = [':user_id' => $user_id];
            
            if ($status) {
                $query .= " AND b.status = :status";
                $params[':status'] = $status;
            }
            
            $query .= " ORDER BY b.created_at DESC";
            
            // Get total count
            $count_query = str_replace("SELECT b.*, c.make, c.model, c.year, c.image_url, c.daily_rate, CONCAT(c.make, ' ', c.model) as car_name, c.image_url as car_image, DATEDIFF(b.end_date, b.start_date) as total_days, c.daily_rate as price_per_day, b.created_at as booking_date", "SELECT COUNT(*)", $query);
            $count_stmt = $this->conn->prepare($count_query);
            $count_stmt->execute($params);
            $total = $count_stmt->fetchColumn();
            
            // Add pagination
            $query = $this->paginate($query, $page, $limit);
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $query = "SELECT b.*, c.make, c.model, c.year, c.image_url, c.daily_rate,
                      CONCAT(c.make, ' ', c.model) as car_name,
                      c.image_url as car_image,
                      DATEDIFF(b.end_date, b.start_date) as total_days,
                      c.daily_rate as price_per_day,
                      b.created_at as booking_date
                      FROM bookings b 
                      JOIN cars c ON b.car_id = c.id 
                      WHERE b.user_id = ?";
            $params = [$user_id];
            
            if ($status) {
                $query .= " AND b.status = ?";
                $params[] = $status;
            }
            
            $query .= " ORDER BY b.created_at DESC";
            
            // Get total count
            $count_query = str_replace("SELECT b.*, c.make, c.model, c.year, c.image_url, c.daily_rate, CONCAT(c.make, ' ', c.model) as car_name, c.image_url as car_image, DATEDIFF(b.end_date, b.start_date) as total_days, c.daily_rate as price_per_day, b.created_at as booking_date", "SELECT COUNT(*)", $query);
            $count_stmt = $this->conn->prepare($count_query);
            $count_stmt->execute($params);
            $count_result = $count_stmt->get_result();
            $total = $count_result ? $count_result->fetch_row()[0] : 0;
            
            // Add pagination
            $query = $this->paginate($query, $page, $limit);
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $result = $stmt->get_result();
            $bookings = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $bookings[] = $row;
                }
            }
        }
        
        $this->sendSuccess([
            'bookings' => $bookings,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    // Get all bookings (admin only)
    public function getAllBookings() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $status = $_GET['status'] ?? null;
        
        $query = "SELECT b.*, c.make, c.model, c.year, c.license_plate, 
                  u.first_name, u.last_name, u.email, u.phone 
                  FROM bookings b 
                  JOIN cars c ON b.car_id = c.id 
                  JOIN users u ON b.user_id = u.id 
                  WHERE 1=1";
        $params = [];
        
        if ($status) {
            $query .= " AND b.status = :status";
            $params[':status'] = $status;
        }
        
        $query .= " ORDER BY b.created_at DESC";
        
        // Get total count
        $count_query = str_replace("SELECT b.*, c.make, c.model, c.year, c.license_plate, u.first_name, u.last_name, u.email, u.phone", "SELECT COUNT(*)", $query);
        $count_stmt = $this->conn->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetchColumn();
        
        // Add pagination
        $query = $this->paginate($query, $page, $limit);
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendSuccess([
            'bookings' => $bookings,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    // Create new booking
    public function createBooking() {
        $token = $this->getAuthHeader();
        
        if (!$token) {
            $this->sendError('Authorization token required', 401);
        }
        
        $data = $this->getRequestData();
        
        // Validate required fields
        $this->validateRequired($data, ['car_id', 'start_date', 'end_date']);
        
        // Sanitize input
        $data = $this->sanitizeInput($data);
        
        // Decode token to get user ID (compatible with admin.php format)
        $decoded = base64_decode($token);
        $parts = explode(':', $decoded);
        if (count($parts) < 2) {
            $this->sendError('Invalid token format', 401);
        }
        $user_id = $parts[0];
        
        // Validate dates
        $start_date = new DateTime($data['start_date']);
        $end_date = new DateTime($data['end_date']);
        $today = new DateTime();
        
        if ($start_date < $today) {
            $this->sendError('Start date cannot be in the past', 400);
        }
        
        if ($end_date <= $start_date) {
            $this->sendError('End date must be after start date', 400);
        }
        
        // Check car availability
        if ($this->use_pdo) {
            $availability_query = "SELECT id FROM bookings 
                                  WHERE car_id = :car_id 
                                  AND status IN ('confirmed', 'active') 
                                  AND ((start_date <= :start_date AND end_date >= :start_date) 
                                       OR (start_date <= :end_date AND end_date >= :end_date) 
                                       OR (start_date >= :start_date AND end_date <= :end_date))";
            
            $availability_stmt = $this->conn->prepare($availability_query);
            $availability_stmt->bindParam(':car_id', $data['car_id']);
            $availability_stmt->bindParam(':start_date', $data['start_date']);
            $availability_stmt->bindParam(':end_date', $data['end_date']);
            $availability_stmt->execute();
            
            if ($availability_stmt->rowCount() > 0) {
                $this->sendError('Car is not available for the selected dates', 409);
            }
        } else {
            $availability_query = "SELECT id FROM bookings 
                                  WHERE car_id = ? 
                                  AND status IN ('confirmed', 'active') 
                                  AND ((start_date <= ? AND end_date >= ?) 
                                       OR (start_date <= ? AND end_date >= ?) 
                                       OR (start_date >= ? AND end_date <= ?))";
            
            $availability_stmt = $this->conn->prepare($availability_query);
            $availability_stmt->bind_param('issssss', 
                $data['car_id'], 
                $data['start_date'], $data['start_date'],
                $data['end_date'], $data['end_date'],
                $data['start_date'], $data['end_date']
            );
            $availability_stmt->execute();
            $availability_result = $availability_stmt->get_result();
            
            if ($availability_result && $availability_result->num_rows > 0) {
                $this->sendError('Car is not available for the selected dates', 409);
            }
        }
        
        // Get car details for pricing
        if ($this->use_pdo) {
            $car_query = "SELECT daily_rate, status FROM cars WHERE id = :car_id";
            $car_stmt = $this->conn->prepare($car_query);
            $car_stmt->bindParam(':car_id', $data['car_id']);
            $car_stmt->execute();
            
            if ($car_stmt->rowCount() == 0) {
                $this->sendError('Car not found', 404);
            }
            
            $car = $car_stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $car_query = "SELECT daily_rate, status FROM cars WHERE id = ?";
            $car_stmt = $this->conn->prepare($car_query);
            $car_stmt->bind_param('i', $data['car_id']);
            $car_stmt->execute();
            $car_result = $car_stmt->get_result();
            
            if (!$car_result || $car_result->num_rows == 0) {
                $this->sendError('Car not found', 404);
            }
            
            $car = $car_result->fetch_assoc();
        }
        
        if ($car['status'] !== 'available') {
            $this->sendError('Car is not available', 400);
        }
        
        // Calculate total amount
        $days = $start_date->diff($end_date)->days;
        $total_amount = isset($data['total_amount']) ? $data['total_amount'] : ($days * $car['daily_rate']);
        
        // Create booking
        if ($this->use_pdo) {
            $query = "INSERT INTO bookings (user_id, car_id, start_date, end_date, pickup_location, 
                      dropoff_location, total_amount, notes) 
                      VALUES (:user_id, :car_id, :start_date, :end_date, :pickup_location, 
                      :dropoff_location, :total_amount, :notes)";
            
            $stmt = $this->conn->prepare($query);
            
            // Store variables for PDO binding (cannot bind expressions directly)
            $pickup_location = $data['pickup_location'] ?? null;
            $dropoff_location = $data['dropoff_location'] ?? null;
            $notes = $data['notes'] ?? null;
            $car_id = $data['car_id'];
            $start_date = $data['start_date'];
            $end_date = $data['end_date'];
            
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':car_id', $car_id);
            $stmt->bindParam(':start_date', $start_date);
            $stmt->bindParam(':end_date', $end_date);
            $stmt->bindParam(':pickup_location', $pickup_location);
            $stmt->bindParam(':dropoff_location', $dropoff_location);
            $stmt->bindParam(':total_amount', $total_amount);
            $stmt->bindParam(':notes', $notes);
            
            if ($stmt->execute()) {
                $booking_id = $this->conn->lastInsertId();
                
                // Create payment record
                if (isset($data['payment_method'])) {
                    $payment_query = "INSERT INTO payments (booking_id, amount, payment_method, status) 
                                    VALUES (:booking_id, :amount, :payment_method, 'pending')";
                    $payment_stmt = $this->conn->prepare($payment_query);
                    $payment_method = $data['payment_method'];
                    $payment_stmt->bindParam(':booking_id', $booking_id);
                    $payment_stmt->bindParam(':amount', $total_amount);
                    $payment_stmt->bindParam(':payment_method', $payment_method);
                    $payment_stmt->execute();
                }
                
                $this->sendSuccess([
                    'booking_id' => $booking_id,
                    'total_amount' => $total_amount,
                    'days' => $days
                ], 'Booking created successfully');
            } else {
                $this->sendError('Failed to create booking', 500);
            }
        } else {
            $query = "INSERT INTO bookings (user_id, car_id, start_date, end_date, pickup_location, 
                      dropoff_location, total_amount, notes) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('iissssds',
                $user_id,
                $data['car_id'],
                $data['start_date'],
                $data['end_date'],
                $data['pickup_location'],
                $data['dropoff_location'],
                $total_amount,
                $data['notes']
            );
            
            if ($stmt->execute()) {
                $booking_id = $this->conn->insert_id;
                
                // Create payment record
                if (isset($data['payment_method'])) {
                    $payment_query = "INSERT INTO payments (booking_id, amount, payment_method, status) 
                                    VALUES (?, ?, ?, 'pending')";
                    $payment_stmt = $this->conn->prepare($payment_query);
                    $payment_stmt->bind_param('ids', $booking_id, $total_amount, $data['payment_method']);
                    $payment_stmt->execute();
                }
                
                $this->sendSuccess([
                    'booking_id' => $booking_id,
                    'total_amount' => $total_amount,
                    'days' => $days
                ], 'Booking created successfully');
            } else {
                $this->sendError('Failed to create booking', 500);
            }
        }
    }
    
    // Update booking status
    public function updateBookingStatus($id) {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $data = $this->getRequestData();
        
        if (!isset($data['status'])) {
            $this->sendError('Status is required', 400);
        }
        
        $allowed_statuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
        if (!in_array($data['status'], $allowed_statuses)) {
            $this->sendError('Invalid status', 400);
        }
        
        $query = "UPDATE bookings SET status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $data['status']);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            // Update car status based on booking status
            if ($data['status'] === 'active') {
                $car_update = "UPDATE cars SET status = 'rented' WHERE id = (SELECT car_id FROM bookings WHERE id = :booking_id)";
                $car_stmt = $this->conn->prepare($car_update);
                $car_stmt->bindParam(':booking_id', $id);
                $car_stmt->execute();
            } elseif (in_array($data['status'], ['completed', 'cancelled'])) {
                $car_update = "UPDATE cars SET status = 'available' WHERE id = (SELECT car_id FROM bookings WHERE id = :booking_id)";
                $car_stmt = $this->conn->prepare($car_update);
                $car_stmt->bindParam(':booking_id', $id);
                $car_stmt->execute();
            }
            
            $this->sendSuccess(null, 'Booking status updated successfully');
        } else {
            $this->sendError('Booking not found or update failed', 404);
        }
    }
    
    // Cancel booking
    public function cancelBooking($id) {
        $token = $this->getAuthHeader();
        
        if (!$token) {
            $this->sendError('Authorization token required', 401);
        }
        
        // Decode token to get user ID (compatible with admin.php format)
        $decoded = base64_decode($token);
        $parts = explode(':', $decoded);
        if (count($parts) < 2) {
            $this->sendError('Invalid token format', 401);
        }
        $user_id = $parts[0];
        
        // Check if booking belongs to user and can be cancelled
        if ($this->use_pdo) {
            $query = "SELECT status, start_date FROM bookings WHERE id = :id AND user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                $this->sendError('Booking not found', 404);
            }
            
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $query = "SELECT status, start_date FROM bookings WHERE id = ? AND user_id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('ii', $id, $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if (!$result || $result->num_rows == 0) {
                $this->sendError('Booking not found', 404);
            }
            
            $booking = $result->fetch_assoc();
        }
        
        if (in_array($booking['status'], ['completed', 'cancelled'])) {
            $this->sendError('Cannot cancel this booking', 400);
        }
        
        // Check if booking can be cancelled (e.g., at least 24 hours before start date)
        $start_date = new DateTime($booking['start_date']);
        $now = new DateTime();
        $hours_until_start = ($start_date->getTimestamp() - $now->getTimestamp()) / 3600;
        
        if ($hours_until_start < 24) {
            $this->sendError('Cannot cancel booking less than 24 hours before start date', 400);
        }
        
        // Update booking status
        if ($this->use_pdo) {
            $update_query = "UPDATE bookings SET status = 'cancelled' WHERE id = :id";
            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bindParam(':id', $id);
            
            if ($update_stmt->execute()) {
                $this->sendSuccess(null, 'Booking cancelled successfully');
            } else {
                $this->sendError('Failed to cancel booking', 500);
            }
        } else {
            $update_query = "UPDATE bookings SET status = 'cancelled' WHERE id = ?";
            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bind_param('i', $id);
            
            if ($update_stmt->execute()) {
                $this->sendSuccess(null, 'Booking cancelled successfully');
            } else {
                $this->sendError('Failed to cancel booking', 500);
            }
        }
    }
    
    // Get booking details
    public function getBooking($id) {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $query = "SELECT b.*, c.make, c.model, c.year, c.color, c.license_plate, c.image_url, 
                  u.first_name, u.last_name, u.email, u.phone 
                  FROM bookings b 
                  JOIN cars c ON b.car_id = c.id 
                  JOIN users u ON b.user_id = u.id 
                  WHERE b.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('Booking not found', 404);
        }
        
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->sendSuccess($booking);
    }
}

// Handle API requests
$bookings = new BookingsAPI();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['id'])) {
            $bookings->getBooking($_GET['id']);
        } elseif (isset($_GET['all']) && $_GET['all'] === 'true') {
            $bookings->getAllBookings();
        } else {
            $bookings->getUserBookings();
        }
        break;
        
    case 'POST':
        $bookings->createBooking();
        break;
        
    case 'PUT':
        if (isset($_GET['id'])) {
            if (isset($_GET['action']) && $_GET['action'] === 'cancel') {
                $bookings->cancelBooking($_GET['id']);
            } else {
                $bookings->updateBookingStatus($_GET['id']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Booking ID required']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
