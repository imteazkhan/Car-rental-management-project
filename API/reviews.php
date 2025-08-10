<?php
require_once 'BaseAPI.php';

class ReviewsAPI extends BaseAPI {
    
    // Get reviews for a car
    public function getCarReviews($car_id) {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        
        $query = "SELECT r.*, u.first_name, u.last_name 
                  FROM reviews r 
                  JOIN users u ON r.user_id = u.id 
                  WHERE r.car_id = :car_id 
                  ORDER BY r.created_at DESC";
        
        $params = [':car_id' => $car_id];
        
        // Get total count
        $count_query = str_replace("SELECT r.*, u.first_name, u.last_name", "SELECT COUNT(*)", $query);
        $count_stmt = $this->conn->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetchColumn();
        
        // Add pagination
        $query = $this->paginate($query, $page, $limit);
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get average rating
        $avg_query = "SELECT AVG(rating) as avg_rating FROM reviews WHERE car_id = :car_id";
        $avg_stmt = $this->conn->prepare($avg_query);
        $avg_stmt->bindParam(':car_id', $car_id);
        $avg_stmt->execute();
        $avg_rating = $avg_stmt->fetchColumn();
        
        $this->sendSuccess([
            'reviews' => $reviews,
            'average_rating' => $avg_rating ? round($avg_rating, 1) : 0,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    // Add review
    public function addReview() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $data = $this->getRequestData();
        
        // Validate required fields
        $this->validateRequired($data, ['car_id', 'booking_id', 'rating']);
        
        // Sanitize input
        $data = $this->sanitizeInput($data);
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        // Validate rating
        if ($data['rating'] < 1 || $data['rating'] > 5) {
            $this->sendError('Rating must be between 1 and 5', 400);
        }
        
        // Verify booking exists, belongs to user, and is completed
        $booking_query = "SELECT id FROM bookings 
                         WHERE id = :booking_id AND user_id = :user_id 
                         AND car_id = :car_id AND status = 'completed'";
        $booking_stmt = $this->conn->prepare($booking_query);
        $booking_stmt->bindParam(':booking_id', $data['booking_id']);
        $booking_stmt->bindParam(':user_id', $user_id);
        $booking_stmt->bindParam(':car_id', $data['car_id']);
        $booking_stmt->execute();
        
        if ($booking_stmt->rowCount() == 0) {
            $this->sendError('Invalid booking or booking not completed', 400);
        }
        
        // Check if review already exists
        $existing_query = "SELECT id FROM reviews WHERE user_id = :user_id AND booking_id = :booking_id";
        $existing_stmt = $this->conn->prepare($existing_query);
        $existing_stmt->bindParam(':user_id', $user_id);
        $existing_stmt->bindParam(':booking_id', $data['booking_id']);
        $existing_stmt->execute();
        
        if ($existing_stmt->rowCount() > 0) {
            $this->sendError('Review already exists for this booking', 409);
        }
        
        // Insert review
        $query = "INSERT INTO reviews (user_id, car_id, booking_id, rating, comment) 
                  VALUES (:user_id, :car_id, :booking_id, :rating, :comment)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':car_id', $data['car_id']);
        $stmt->bindParam(':booking_id', $data['booking_id']);
        $stmt->bindParam(':rating', $data['rating']);
        $stmt->bindParam(':comment', $data['comment'] ?? null);
        
        if ($stmt->execute()) {
            $review_id = $this->conn->lastInsertId();
            $this->sendSuccess(['review_id' => $review_id], 'Review added successfully');
        } else {
            $this->sendError('Failed to add review', 500);
        }
    }
    
    // Update review
    public function updateReview($id) {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $data = $this->getRequestData();
        $data = $this->sanitizeInput($data);
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        // Verify review belongs to user
        $check_query = "SELECT id FROM reviews WHERE id = :id AND user_id = :user_id";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(':id', $id);
        $check_stmt->bindParam(':user_id', $user_id);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() == 0) {
            $this->sendError('Review not found or unauthorized', 404);
        }
        
        // Build update query
        $fields = [];
        $params = [':id' => $id];
        
        if (isset($data['rating'])) {
            if ($data['rating'] < 1 || $data['rating'] > 5) {
                $this->sendError('Rating must be between 1 and 5', 400);
            }
            $fields[] = "rating = :rating";
            $params[':rating'] = $data['rating'];
        }
        
        if (isset($data['comment'])) {
            $fields[] = "comment = :comment";
            $params[':comment'] = $data['comment'];
        }
        
        if (empty($fields)) {
            $this->sendError('No valid fields to update', 400);
        }
        
        $query = "UPDATE reviews SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($params)) {
            $this->sendSuccess(null, 'Review updated successfully');
        } else {
            $this->sendError('Update failed', 500);
        }
    }
    
    // Delete review
    public function deleteReview($id) {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        // Verify review belongs to user
        $query = "DELETE FROM reviews WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':user_id', $user_id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            $this->sendSuccess(null, 'Review deleted successfully');
        } else {
            $this->sendError('Review not found or unauthorized', 404);
        }
    }
    
    // Get user's reviews
    public function getUserReviews() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        // Decode token to get user ID
        $decoded = base64_decode($token);
        $user_id = explode(':', $decoded)[0];
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        
        $query = "SELECT r.*, c.make, c.model, c.year, c.image_url 
                  FROM reviews r 
                  JOIN cars c ON r.car_id = c.id 
                  WHERE r.user_id = :user_id 
                  ORDER BY r.created_at DESC";
        
        $params = [':user_id' => $user_id];
        
        // Get total count
        $count_query = str_replace("SELECT r.*, c.make, c.model, c.year, c.image_url", "SELECT COUNT(*)", $query);
        $count_stmt = $this->conn->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetchColumn();
        
        // Add pagination
        $query = $this->paginate($query, $page, $limit);
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendSuccess([
            'reviews' => $reviews,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
}

// Handle API requests
$reviews = new ReviewsAPI();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['car_id'])) {
            $reviews->getCarReviews($_GET['car_id']);
        } else {
            $reviews->getUserReviews();
        }
        break;
        
    case 'POST':
        $reviews->addReview();
        break;
        
    case 'PUT':
        if (isset($_GET['id'])) {
            $reviews->updateReview($_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Review ID required']);
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['id'])) {
            $reviews->deleteReview($_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Review ID required']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
