<?php
require_once 'BaseAPI.php';

class CarsAPI extends BaseAPI {
    
    // Get all cars with filters
    public function getCars() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $category = $_GET['category'] ?? null;
        $status = $_GET['status'] ?? 'available';
        $min_price = $_GET['min_price'] ?? null;
        $max_price = $_GET['max_price'] ?? null;
        $search = $_GET['search'] ?? null;
        
        $query = "SELECT c.*, cc.name as category_name 
                  FROM cars c 
                  LEFT JOIN car_categories cc ON c.category_id = cc.id 
                  WHERE 1=1";
        $params = [];
        
        if ($status) {
            $query .= " AND c.status = :status";
            $params[':status'] = $status;
        }
        
        if ($category) {
            $query .= " AND c.category_id = :category";
            $params[':category'] = $category;
        }
        
        if ($min_price) {
            $query .= " AND c.daily_rate >= :min_price";
            $params[':min_price'] = $min_price;
        }
        
        if ($max_price) {
            $query .= " AND c.daily_rate <= :max_price";
            $params[':max_price'] = $max_price;
        }
        
        if ($search) {
            $query .= " AND (c.make LIKE :search OR c.model LIKE :search OR c.description LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        $query .= " ORDER BY c.created_at DESC";
        
        // Get total count
        $count_query = str_replace("SELECT c.*, cc.name as category_name", "SELECT COUNT(*)", $query);
        $count_stmt = $this->conn->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetchColumn();
        
        // Add pagination
        $query = $this->paginate($query, $page, $limit);
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $cars = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON features
        foreach ($cars as &$car) {
            if ($car['features']) {
                $car['features'] = json_decode($car['features'], true);
            }
        }
        
        $this->sendSuccess([
            'cars' => $cars,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    // Get single car by ID
    public function getCar($id) {
        $query = "SELECT c.*, cc.name as category_name 
                  FROM cars c 
                  LEFT JOIN car_categories cc ON c.category_id = cc.id 
                  WHERE c.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('Car not found', 404);
        }
        
        $car = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($car['features']) {
            $car['features'] = json_decode($car['features'], true);
        }
        
        // Get average rating
        $rating_query = "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
                         FROM reviews WHERE car_id = :car_id";
        $rating_stmt = $this->conn->prepare($rating_query);
        $rating_stmt->bindParam(':car_id', $id);
        $rating_stmt->execute();
        $rating_data = $rating_stmt->fetch(PDO::FETCH_ASSOC);
        
        $car['avg_rating'] = $rating_data['avg_rating'] ? round($rating_data['avg_rating'], 1) : 0;
        $car['review_count'] = (int)$rating_data['review_count'];
        
        $this->sendSuccess($car);
    }
    
    // Add new car (admin only)
    public function addCar() {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $data = $this->getRequestData();
        
        // Validate required fields
        $this->validateRequired($data, ['make', 'model', 'year', 'license_plate', 'daily_rate']);
        
        // Sanitize input
        $data = $this->sanitizeInput($data);
        
        // Check if license plate already exists
        $check_query = "SELECT id FROM cars WHERE license_plate = :license_plate";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(':license_plate', $data['license_plate']);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            $this->sendError('Car with this license plate already exists', 409);
        }
        
        // Prepare features JSON
        $features = isset($data['features']) ? json_encode($data['features']) : null;
        
        $query = "INSERT INTO cars (make, model, year, color, license_plate, vin, category_id, daily_rate, 
                  mileage, fuel_type, transmission, seats, image_url, description, features) 
                  VALUES (:make, :model, :year, :color, :license_plate, :vin, :category_id, :daily_rate, 
                  :mileage, :fuel_type, :transmission, :seats, :image_url, :description, :features)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':make', $data['make']);
        $stmt->bindParam(':model', $data['model']);
        $stmt->bindParam(':year', $data['year']);
        $stmt->bindParam(':color', $data['color'] ?? null);
        $stmt->bindParam(':license_plate', $data['license_plate']);
        $stmt->bindParam(':vin', $data['vin'] ?? null);
        $stmt->bindParam(':category_id', $data['category_id'] ?? null);
        $stmt->bindParam(':daily_rate', $data['daily_rate']);
        $stmt->bindParam(':mileage', $data['mileage'] ?? 0);
        $stmt->bindParam(':fuel_type', $data['fuel_type'] ?? 'petrol');
        $stmt->bindParam(':transmission', $data['transmission'] ?? 'manual');
        $stmt->bindParam(':seats', $data['seats'] ?? 5);
        $stmt->bindParam(':image_url', $data['image_url'] ?? null);
        $stmt->bindParam(':description', $data['description'] ?? null);
        $stmt->bindParam(':features', $features);
        
        if ($stmt->execute()) {
            $car_id = $this->conn->lastInsertId();
            $this->sendSuccess(['car_id' => $car_id], 'Car added successfully');
        } else {
            $this->sendError('Failed to add car', 500);
        }
    }
    
    // Update car (admin only)
    public function updateCar($id) {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        $data = $this->getRequestData();
        $data = $this->sanitizeInput($data);
        
        // Build update query dynamically
        $fields = [];
        $params = [':id' => $id];
        
        $allowed_fields = ['make', 'model', 'year', 'color', 'license_plate', 'vin', 'category_id', 
                          'daily_rate', 'mileage', 'fuel_type', 'transmission', 'seats', 'status', 
                          'image_url', 'description'];
        
        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (isset($data['features'])) {
            $fields[] = "features = :features";
            $params[':features'] = json_encode($data['features']);
        }
        
        if (empty($fields)) {
            $this->sendError('No valid fields to update', 400);
        }
        
        $query = "UPDATE cars SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($params)) {
            $this->sendSuccess(null, 'Car updated successfully');
        } else {
            $this->sendError('Update failed', 500);
        }
    }
    
    // Delete car (admin only)
    public function deleteCar($id) {
        $token = $this->getAuthHeader();
        
        if (!$this->verifyToken($token)) {
            $this->sendError('Unauthorized', 401);
        }
        
        // Check if car has active bookings
        $check_query = "SELECT id FROM bookings WHERE car_id = :car_id AND status IN ('confirmed', 'active')";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(':car_id', $id);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            $this->sendError('Cannot delete car with active bookings', 400);
        }
        
        $query = "DELETE FROM cars WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            $this->sendSuccess(null, 'Car deleted successfully');
        } else {
            $this->sendError('Car not found or delete failed', 404);
        }
    }
    
    // Get car categories
    public function getCategories() {
        $query = "SELECT * FROM car_categories ORDER BY name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->sendSuccess($categories);
    }
}

// Handle API requests
$cars = new CarsAPI();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'categories':
                    $cars->getCategories();
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Action not found']);
            }
        } elseif (isset($_GET['id'])) {
            $cars->getCar($_GET['id']);
        } else {
            $cars->getCars();
        }
        break;
        
    case 'POST':
        $cars->addCar();
        break;
        
    case 'PUT':
        if (isset($_GET['id'])) {
            $cars->updateCar($_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Car ID required']);
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['id'])) {
            $cars->deleteCar($_GET['id']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Car ID required']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
