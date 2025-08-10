<?php
require_once 'BaseAPI.php';

class BookingsAPI extends BaseAPI {
    
    // Get user bookings
    public function getUserBookings() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $status = $_GET['status'] ?? null;
        
        $query = "SELECT b.*, c.make, c.model, c.year, c.image_url, c.daily_rate 
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
        $count_query = str_replace("SELECT b.*, c.make, c.model, c.year, c.image_url, c.daily_rate", "SELECT COUNT(*)", $query);
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
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $data = $this->getRequestData();
        
        // Validate required fields
        $this->validateRequired($data, ['car_id', 'start_date', 'end_date']);
        
        // Sanitize input
        $data = $this->sanitizeInput($data);
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
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
        
        // Get car details for pricing
        $car_query = "SELECT daily_rate, status FROM cars WHERE id = :car_id";
        $car_stmt = $this->conn->prepare($car_query);
        $car_stmt->bindParam(':car_id', $data['car_id']);
        $car_stmt->execute();
        
        if ($car_stmt->rowCount() == 0) {
            $this->sendError('Car not found', 404);
        }
        
        $car = $car_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($car['status'] !== 'available') {
            $this->sendError('Car is not available', 400);
        }
        
        // Calculate total amount
        $days = $start_date->diff($end_date)->days;
        $total_amount = $days * $car['daily_rate'];
        
        // Create booking
        $query = "INSERT INTO bookings (user_id, car_id, start_date, end_date, pickup_location, 
                  dropoff_location, total_amount, notes) 
                  VALUES (:user_id, :car_id, :start_date, :end_date, :pickup_location, 
                  :dropoff_location, :total_amount, :notes)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':car_id', $data['car_id']);
        $stmt->bindParam(':start_date', $data['start_date']);
        $stmt->bindParam(':end_date', $data['end_date']);
        $stmt->bindParam(':pickup_location', $data['pickup_location'] ?? null);
        $stmt->bindParam(':dropoff_location', $data['dropoff_location'] ?? null);
        $stmt->bindParam(':total_amount', $total_amount);
        $stmt->bindParam(':notes', $data['notes'] ?? null);
        
        if ($stmt->execute()) {
            $booking_id = $this->conn->lastInsertId();
            $this->sendSuccess([
                'booking_id' => $booking_id,
                'total_amount' => $total_amount,
                'days' => $days
            ], 'Booking created successfully');
        } else {
            $this->sendError('Failed to create booking', 500);
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
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        // Check if booking belongs to user and can be cancelled
        $query = "SELECT status, start_date FROM bookings WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('Booking not found', 404);
        }
        
        $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        
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
        $update_query = "UPDATE bookings SET status = 'cancelled' WHERE id = :id";
        $update_stmt = $this->conn->prepare($update_query);
        $update_stmt->bindParam(':id', $id);
        
        if ($update_stmt->execute()) {
            $this->sendSuccess(null, 'Booking cancelled successfully');
        } else {
            $this->sendError('Failed to cancel booking', 500);
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
