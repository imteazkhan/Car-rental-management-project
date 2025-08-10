<?php
require_once 'BaseAPI.php';

class PaymentsAPI extends BaseAPI {
    
    // Process payment
    public function processPayment() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $data = $this->getRequestData();
        
        // Validate required fields
        $this->validateRequired($data, ['booking_id', 'amount', 'payment_method']);
        
        // Sanitize input
        $data = $this->sanitizeInput($data);
        
        // Verify booking exists and belongs to user
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        $booking_query = "SELECT id, total_amount, payment_status FROM bookings 
                         WHERE id = :booking_id AND user_id = :user_id";
        $booking_stmt = $this->conn->prepare($booking_query);
        $booking_stmt->bindParam(':booking_id', $data['booking_id']);
        $booking_stmt->bindParam(':user_id', $user_id);
        $booking_stmt->execute();
        
        if ($booking_stmt->rowCount() == 0) {
            $this->sendError('Booking not found', 404);
        }
        
        $booking = $booking_stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($booking['payment_status'] === 'paid') {
            $this->sendError('Booking already paid', 400);
        }
        
        if ($data['amount'] != $booking['total_amount']) {
            $this->sendError('Payment amount does not match booking total', 400);
        }
        
        // Simulate payment processing (in real app, integrate with payment gateway)
        $transaction_id = 'TXN_' . time() . '_' . rand(1000, 9999);
        $payment_status = 'completed'; // In real app, this would depend on payment gateway response
        
        // Insert payment record
        $payment_query = "INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status) 
                         VALUES (:booking_id, :amount, :payment_method, :transaction_id, :status)";
        
        $payment_stmt = $this->conn->prepare($payment_query);
        $payment_stmt->bindParam(':booking_id', $data['booking_id']);
        $payment_stmt->bindParam(':amount', $data['amount']);
        $payment_stmt->bindParam(':payment_method', $data['payment_method']);
        $payment_stmt->bindParam(':transaction_id', $transaction_id);
        $payment_stmt->bindParam(':status', $payment_status);
        
        if ($payment_stmt->execute()) {
            // Update booking payment status
            $update_booking = "UPDATE bookings SET payment_status = 'paid', status = 'confirmed' 
                              WHERE id = :booking_id";
            $update_stmt = $this->conn->prepare($update_booking);
            $update_stmt->bindParam(':booking_id', $data['booking_id']);
            $update_stmt->execute();
            
            $payment_id = $this->conn->lastInsertId();
            
            $this->sendSuccess([
                'payment_id' => $payment_id,
                'transaction_id' => $transaction_id,
                'status' => $payment_status
            ], 'Payment processed successfully');
        } else {
            $this->sendError('Payment processing failed', 500);
        }
    }
    
    // Get payment history
    public function getPaymentHistory() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        
        $query = "SELECT p.*, b.start_date, b.end_date, c.make, c.model, c.year 
                  FROM payments p 
                  JOIN bookings b ON p.booking_id = b.id 
                  JOIN cars c ON b.car_id = c.id 
                  WHERE b.user_id = :user_id 
                  ORDER BY p.payment_date DESC";
        
        $params = [':user_id' => $user_id];
        
        // Get total count
        $count_query = str_replace("SELECT p.*, b.start_date, b.end_date, c.make, c.model, c.year", "SELECT COUNT(*)", $query);
        $count_stmt = $this->conn->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetchColumn();
        
        // Add pagination
        $query = $this->paginate($query, $page, $limit);
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendSuccess([
            'payments' => $payments,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    // Get all payments (admin only)
    public function getAllPayments() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $status = $_GET['status'] ?? null;
        
        $query = "SELECT p.*, b.start_date, b.end_date, c.make, c.model, c.year, 
                  u.first_name, u.last_name, u.email 
                  FROM payments p 
                  JOIN bookings b ON p.booking_id = b.id 
                  JOIN cars c ON b.car_id = c.id 
                  JOIN users u ON b.user_id = u.id 
                  WHERE 1=1";
        $params = [];
        
        if ($status) {
            $query .= " AND p.status = :status";
            $params[':status'] = $status;
        }
        
        $query .= " ORDER BY p.payment_date DESC";
        
        // Get total count
        $count_query = str_replace("SELECT p.*, b.start_date, b.end_date, c.make, c.model, c.year, u.first_name, u.last_name, u.email", "SELECT COUNT(*)", $query);
        $count_stmt = $this->conn->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetchColumn();
        
        // Add pagination
        $query = $this->paginate($query, $page, $limit);
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendSuccess([
            'payments' => $payments,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    // Refund payment (admin only)
    public function refundPayment($id) {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $data = $this->getRequestData();
        
        // Get payment details
        $query = "SELECT p.*, b.status as booking_status FROM payments p 
                  JOIN bookings b ON p.booking_id = b.id 
                  WHERE p.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('Payment not found', 404);
        }
        
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($payment['status'] !== 'completed') {
            $this->sendError('Can only refund completed payments', 400);
        }
        
        if ($payment['booking_status'] === 'active') {
            $this->sendError('Cannot refund payment for active booking', 400);
        }
        
        // Process refund (simulate)
        $refund_amount = $data['amount'] ?? $payment['amount'];
        
        if ($refund_amount > $payment['amount']) {
            $this->sendError('Refund amount cannot exceed original payment', 400);
        }
        
        // Update payment status
        $update_query = "UPDATE payments SET status = 'refunded' WHERE id = :id";
        $update_stmt = $this->conn->prepare($update_query);
        $update_stmt->bindParam(':id', $id);
        
        if ($update_stmt->execute()) {
            // Update booking payment status
            $update_booking = "UPDATE bookings SET payment_status = 'refunded' WHERE id = :booking_id";
            $booking_stmt = $this->conn->prepare($update_booking);
            $booking_stmt->bindParam(':booking_id', $payment['booking_id']);
            $booking_stmt->execute();
            
            $this->sendSuccess([
                'refund_amount' => $refund_amount,
                'original_amount' => $payment['amount']
            ], 'Payment refunded successfully');
        } else {
            $this->sendError('Refund processing failed', 500);
        }
    }
}

// Handle API requests
$payments = new PaymentsAPI();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['all']) && $_GET['all'] === 'true') {
            $payments->getAllPayments();
        } else {
            $payments->getPaymentHistory();
        }
        break;
        
    case 'POST':
        $payments->processPayment();
        break;
        
    case 'PUT':
        if (isset($_GET['id']) && isset($_GET['action']) && $_GET['action'] === 'refund') {
            $payments->refundPayment($_GET['id']);
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
