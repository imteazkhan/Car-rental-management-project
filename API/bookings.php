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
            $query = "SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at, c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate,
                      CONCAT(c.make, ' ', c.model) as car_name_full,
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
            $count_query = str_replace("SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at, c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate, CONCAT(c.make, ' ', c.model) as car_name_full, DATEDIFF(b.end_date, b.start_date) as total_days, c.daily_rate as price_per_day, b.created_at as booking_date", "SELECT COUNT(*)", $query);
            $count_stmt = $this->conn->prepare($count_query);
            $count_stmt->execute($params);
            $total = $count_stmt->fetchColumn();
            
            // Add pagination
            $query = $this->paginate($query, $page, $limit);
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $query = "SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at, c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate,
                      CONCAT(c.make, ' ', c.model) as car_name_full,
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
            $count_query = str_replace("SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at, c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate, CONCAT(c.make, ' ', c.model) as car_name_full, DATEDIFF(b.end_date, b.start_date) as total_days, c.daily_rate as price_per_day, b.created_at as booking_date", "SELECT COUNT(*)", $query);
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
        try {
            error_log('=== GET ALL BOOKINGS DEBUG START ===');
            
            $token = $this->getAuthHeader();
            error_log('Token for getAllBookings: ' . ($token ? 'Yes' : 'No'));
            
            if (!$token) {
                error_log('ERROR: No authorization token for getAllBookings');
                $this->sendError('Authorization token required', 401);
            }
            
            // Decode token to get user ID (compatible with format used in other methods)
            $decoded = base64_decode($token);
            $parts = explode(':', $decoded);
            error_log('getAllBookings token parts: ' . print_r($parts, true));
            
            if (count($parts) < 2) {
                error_log('ERROR: Invalid token format for getAllBookings');
                $this->sendError('Invalid token format. Expected format: user_id:email', 401);
            }
            $user_id = $parts[0];
            
            if (!is_numeric($user_id)) {
                error_log('ERROR: Invalid user ID in token for getAllBookings');
                $this->sendError('Invalid user ID in token', 401);
            }
            
            error_log('Admin accessing all bookings with user_id: ' . $user_id);
        
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 10;
            $status = $_GET['status'] ?? null;
            
            // Use correct database column names that match the actual schema
            if ($this->use_pdo) {
                $query = "SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at, 
                          c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate as car_rent_price, 
                          u.username, u.email 
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
                $count_query = str_replace("SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at, c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate as car_rent_price, u.username, u.email", "SELECT COUNT(*)", $query);
                $count_stmt = $this->conn->prepare($count_query);
                $count_stmt->execute($params);
                $total = $count_stmt->fetchColumn();
                
                // Add pagination
                $query = $this->paginate($query, $page, $limit);
                
                $stmt = $this->conn->prepare($query);
                $stmt->execute($params);
                $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $query = "SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at, 
                          c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate as car_rent_price, 
                          u.username, u.email 
                          FROM bookings b 
                          JOIN cars c ON b.car_id = c.id 
                          JOIN users u ON b.user_id = u.id 
                          WHERE 1=1";
                $params = [];
                
                if ($status) {
                    $query .= " AND b.status = ?";
                    $params[] = $status;
                }
                
                $query .= " ORDER BY b.created_at DESC";
                
                // Get total count
                $count_query = str_replace("SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at, c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate as car_rent_price, u.username, u.email", "SELECT COUNT(*)", $query);
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
            
            error_log('getAllBookings query executed successfully, found: ' . count($bookings) . ' bookings');
            error_log('=== GET ALL BOOKINGS DEBUG END ===');
            
            $this->sendSuccess([
                'bookings' => $bookings,
                'pagination' => [
                    'current_page' => (int)$page,
                    'per_page' => (int)$limit,
                    'total' => (int)$total,
                    'total_pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            error_log('getAllBookings error: ' . $e->getMessage());
            $this->sendError('Failed to fetch bookings: ' . $e->getMessage(), 500);
        }
    }
    
    // Create new booking
    public function createBooking() {
        try {
            error_log('=== CREATE BOOKING DEBUG START ===');
            
            $token = $this->getAuthHeader();
            error_log('Token received: ' . ($token ? 'Yes (length: ' . strlen($token) . ')' : 'No'));
            
            if (!$token) {
                error_log('ERROR: No authorization token provided');
                $this->sendError('Authorization token required', 401);
            }
            
            // Decode token to get user ID (compatible with admin.php format)
            $decoded = base64_decode($token);
            $parts = explode(':', $decoded);
            error_log('Token decoded parts: ' . print_r($parts, true));
            
            if (count($parts) < 2) {
                error_log('ERROR: Invalid token format - expected user_id:email');
                $this->sendError('Invalid token format. Expected format: user_id:email', 401);
            }
            $user_id = $parts[0];
            
            // Validate user_id is numeric
            if (!is_numeric($user_id)) {
                error_log('ERROR: User ID is not numeric: ' . $user_id);
                $this->sendError('Invalid user ID in token', 401);
            }
            
            error_log('Authenticated user ID: ' . $user_id);
            
            $data = $this->getRequestData();
            error_log('Request data received: ' . json_encode($data));
            
            // Validate required fields
            $this->validateRequired($data, ['car_id', 'start_date', 'end_date']);
            
            // Sanitize input
            $data = $this->sanitizeInput($data);
            error_log('Sanitized data: ' . json_encode($data));
        
        // Validate dates
        error_log('Validating dates - start: ' . $data['start_date'] . ', end: ' . $data['end_date']);
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
        error_log('Checking car availability for car_id: ' . $data['car_id']);
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
        error_log('Getting car details for car_id: ' . $data['car_id']);
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
        $total_price = isset($data['total_price']) ? $data['total_price'] : ($days * $car['daily_rate']);
        error_log('Calculated booking details - days: ' . $days . ', total_price: ' . $total_price);
        
        // Create booking
        error_log('Creating booking with user_id: ' . $user_id . ', car_id: ' . $data['car_id']);
        if ($this->use_pdo) {
            $query = "INSERT INTO bookings (user_id, car_id, start_date, end_date, total_amount) 
                      VALUES (:user_id, :car_id, :start_date, :end_date, :total_amount)";
            
            $stmt = $this->conn->prepare($query);
            
            // Store variables for PDO binding (cannot bind expressions directly)
            $car_id = $data['car_id'];
            $start_date = $data['start_date'];
            $end_date = $data['end_date'];
            
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':car_id', $car_id);
            $stmt->bindParam(':start_date', $start_date);
            $stmt->bindParam(':end_date', $end_date);
            $stmt->bindParam(':total_amount', $total_price);
            
            if ($stmt->execute()) {
                $booking_id = $this->conn->lastInsertId();
                error_log('Booking created successfully with ID: ' . $booking_id);
                
                // Create payment record
                if (isset($data['payment_method'])) {
                    $payment_query = "INSERT INTO payments (booking_id, amount, payment_method, status) 
                                    VALUES (:booking_id, :amount, :payment_method, 'pending')";
                    $payment_stmt = $this->conn->prepare($payment_query);
                    $payment_method = $data['payment_method'];
                    $payment_stmt->bindParam(':booking_id', $booking_id);
                    $payment_stmt->bindParam(':amount', $total_price);
                    $payment_stmt->bindParam(':payment_method', $payment_method);
                    $payment_stmt->execute();
                }
                
                $this->sendSuccess([
                    'booking_id' => $booking_id,
                    'total_price' => $total_price,
                    'days' => $days
                ], 'Booking created successfully');
            } else {
                $errorInfo = $stmt->errorInfo();
                error_log('PDO booking creation failed: ' . print_r($errorInfo, true));
                $this->sendError('Failed to create booking - Database error: ' . $errorInfo[2], 500);
            }
        } else {
            error_log('Using MySQLi for booking insertion');
            $query = "INSERT INTO bookings (user_id, car_id, start_date, end_date, total_amount) 
                      VALUES (?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('iisss',
                $user_id,
                $data['car_id'],
                $data['start_date'],
                $data['end_date'],
                $total_price
            );
            
            if ($stmt->execute()) {
                $booking_id = $this->conn->insert_id;
                error_log('MySQLi booking created successfully with ID: ' . $booking_id);
                
                // Create payment record
                if (isset($data['payment_method'])) {
                    $payment_query = "INSERT INTO payments (booking_id, amount, payment_method, status) 
                                    VALUES (?, ?, ?, 'pending')";
                    $payment_stmt = $this->conn->prepare($payment_query);
                    $payment_stmt->bind_param('ids', $booking_id, $total_price, $data['payment_method']);
                    $payment_stmt->execute();
                }
                
                $this->sendSuccess([
                    'booking_id' => $booking_id,
                    'total_price' => $total_price,
                    'days' => $days
                ], 'Booking created successfully');
            } else {
                error_log('MySQLi booking creation failed: ' . $this->conn->error);
                $this->sendError('Failed to create booking - Database error: ' . $this->conn->error, 500);
            }
        }
        } catch (Exception $e) {
            error_log('BOOKING ERROR: ' . $e->getMessage());
            error_log('BOOKING ERROR TRACE: ' . $e->getTraceAsString());
            $this->sendError('Booking creation failed: ' . $e->getMessage(), 500);
        }
        error_log('=== CREATE BOOKING DEBUG END ===');
    }
    
    // Generate invoice for a booking
    public function generateInvoice($booking_id) {
        try {
            error_log('=== GENERATE INVOICE DEBUG START ===');
            
            $token = $this->getAuthHeader();
            error_log('Token for invoice: ' . ($token ? 'Yes' : 'No'));
            
            if (!$token) {
                error_log('ERROR: No authorization token for invoice');
                $this->sendError('Authorization token required', 401);
            }
            
            // Decode token to get user ID (compatible with format used in other methods)
            $decoded = base64_decode($token);
            $parts = explode(':', $decoded);
            error_log('Invoice token parts: ' . print_r($parts, true));
            
            if (count($parts) < 2) {
                error_log('ERROR: Invalid token format for invoice');
                $this->sendError('Invalid token format. Expected format: user_id:email', 401);
            }
            $user_id = $parts[0];
            
            if (!is_numeric($user_id)) {
                error_log('ERROR: Invalid user ID in token for invoice');
                $this->sendError('Invalid user ID in token', 401);
            }
            
            error_log('Fetching invoice for booking_id: ' . $booking_id . ', user_id: ' . $user_id);

            // Fetch booking details with correct column names
            if ($this->use_pdo) {
                $query = "SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at,
                          c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate as car_rent_price, c.fuel_type as car_fuel_type, c.transmission as car_transmission, c.seats as car_seats,
                          u.username, u.email, u.phone,
                          DATEDIFF(b.end_date, b.start_date) as total_days
                          FROM bookings b
                          JOIN cars c ON b.car_id = c.id
                          JOIN users u ON b.user_id = u.id
                          WHERE b.id = :booking_id AND b.user_id = :user_id";
                
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':booking_id', $booking_id);
                $stmt->bindParam(':user_id', $user_id);
                $stmt->execute();
                $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            } else {
                $query = "SELECT b.id as booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_amount as total_price, b.status as booking_status, b.created_at,
                          c.make as car_name, c.model as car_model, c.image_url as car_image, c.daily_rate as car_rent_price, c.fuel_type as car_fuel_type, c.transmission as car_transmission, c.seats as car_seats,
                          u.username, u.email, u.phone,
                          DATEDIFF(b.end_date, b.start_date) as total_days
                          FROM bookings b
                          JOIN cars c ON b.car_id = c.id
                          JOIN users u ON b.user_id = u.id
                          WHERE b.id = ? AND b.user_id = ?";
                
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param('ii', $booking_id, $user_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $booking = $result ? $result->fetch_assoc() : null;
            }

            error_log('Booking found: ' . ($booking ? 'Yes' : 'No'));
            
            if (!$booking) {
                error_log('ERROR: Booking not found for invoice');
                $this->sendError('Booking not found or access denied', 404);
            }

            // Fetch payment details for the booking (if payments table exists)
            $payment = null;
            try {
                if ($this->use_pdo) {
                    $payment_query = "SELECT payment_id, amount, payment_date, payment_method, transaction_id, status
                                      FROM payments
                                      WHERE booking_id = :booking_id";
                    $payment_stmt = $this->conn->prepare($payment_query);
                    $payment_stmt->bindParam(':booking_id', $booking_id);
                    $payment_stmt->execute();
                    $payment = $payment_stmt->fetch(PDO::FETCH_ASSOC);
                } else {
                    $payment_query = "SELECT payment_id, amount, payment_date, payment_method, transaction_id, status
                                      FROM payments
                                      WHERE booking_id = ?";
                    $payment_stmt = $this->conn->prepare($payment_query);
                    $payment_stmt->bind_param('i', $booking_id);
                    $payment_stmt->execute();
                    $payment_result = $payment_stmt->get_result();
                    $payment = $payment_result ? $payment_result->fetch_assoc() : null;
                }
            } catch (Exception $e) {
                error_log('Note: Payments table not found or accessible, continuing without payment details');
                // Continue without payment details if payments table doesn't exist
            }

            $invoice_data = [
                'booking_details' => $booking,
                'payment_details' => $payment,
                'invoice_date' => date('Y-m-d H:i:s'),
                'invoice_number' => 'INV-' . str_pad($booking_id, 6, '0', STR_PAD_LEFT)
            ];

            error_log('Invoice generated successfully for booking: ' . $booking_id);
            error_log('=== GENERATE INVOICE DEBUG END ===');
            
            $this->sendSuccess($invoice_data, 'Invoice generated successfully');
        } catch (Exception $e) {
            error_log('Invoice generation error: ' . $e->getMessage());
            $this->sendError('Failed to generate invoice: ' . $e->getMessage(), 500);
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
        
        $query = "UPDATE bookings SET booking_status = :booking_status WHERE booking_id = :booking_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':booking_status', $data['status']);
        $stmt->bindParam(':booking_id', $id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            // Update car status based on booking status
            if ($data['status'] === 'active') {
                $car_update = "UPDATE cars SET car_status = 'rented' WHERE id = (SELECT car_id FROM bookings WHERE booking_id = :booking_id)";
                $car_stmt = $this->conn->prepare($car_update);
                $car_stmt->bindParam(':booking_id', $id);
                $car_stmt->execute();
            } elseif (in_array($data['status'], ['completed', 'cancelled'])) {
                $car_update = "UPDATE cars SET car_status = 'available' WHERE id = (SELECT car_id FROM bookings WHERE booking_id = :booking_id)";
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
            $query = "SELECT booking_status, start_date FROM bookings WHERE booking_id = :booking_id AND user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':booking_id', $id);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                $this->sendError('Booking not found', 404);
            }
            
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $query = "SELECT booking_status, start_date FROM bookings WHERE booking_id = ? AND user_id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('ii', $id, $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if (!$result || $result->num_rows == 0) {
                $this->sendError('Booking not found', 404);
            }
            
            $booking = $result->fetch_assoc();
        }
        
        if (in_array($booking['booking_status'], ['completed', 'cancelled'])) {
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
            $update_query = "UPDATE bookings SET booking_status = 'cancelled' WHERE booking_id = :booking_id";
            $update_stmt = $this->conn->prepare($update_query);
            $update_stmt->bindParam(':booking_id', $id);
            
            if ($update_stmt->execute()) {
                $this->sendSuccess(null, 'Booking cancelled successfully');
            } else {
                $this->sendError('Failed to cancel booking', 500);
            }
        } else {
            $update_query = "UPDATE bookings SET booking_status = 'cancelled' WHERE booking_id = ?";
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
        
        $query = "SELECT b.booking_id, b.user_id, b.car_id, b.start_date, b.end_date, b.total_price, b.booking_status, b.created_at, c.car_name, c.car_model, c.car_image, c.car_rent_price, c.car_fuel_type, c.car_transmission, c.car_seats, 
                  u.username, u.email, u.phone 
                  FROM bookings b 
                  JOIN cars c ON b.car_id = c.id 
                  JOIN users u ON b.user_id = u.id 
                  WHERE b.booking_id = :booking_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':booking_id', $id);
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
            if (isset($_GET['action']) && $_GET['action'] === 'invoice') {
                $bookings->generateInvoice($_GET['id']);
            } else {
                $bookings->getBooking($_GET['id']);
            }
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
