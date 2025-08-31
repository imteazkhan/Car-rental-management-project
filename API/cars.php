<?php
// Suppress error output to prevent HTML in JSON responses
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

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

class CarsAPI extends BaseAPI {
    
    // Get all cars with filters
    public function getCars() {
        try {
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 10;
            $category = $_GET['category'] ?? null;
            $status = $_GET['status'] ?? null; // Allow all statuses for admin
            $min_price = $_GET['min_price'] ?? null;
            $max_price = $_GET['max_price'] ?? null;
            $search = $_GET['search'] ?? null;
            
            $query = "SELECT c.*, cc.name as category_name, c.image_url 
                      FROM cars c 
                      LEFT JOIN car_categories cc ON c.category_id = cc.id 
                      WHERE 1=1";
            $params = [];
            
            if ($status) {
                if ($this->use_pdo) {
                    $query .= " AND c.status = :status";
                    $params[':status'] = $status;
                } else {
                    $query .= " AND c.status = ?";
                    $params[] = $status;
                }
            }
            
            if ($category) {
                if ($this->use_pdo) {
                    $query .= " AND c.category_id = :category";
                    $params[':category'] = $category;
                } else {
                    $query .= " AND c.category_id = ?";
                    $params[] = $category;
                }
            }
            
            if ($min_price) {
                if ($this->use_pdo) {
                    $query .= " AND c.daily_rate >= :min_price";
                    $params[':min_price'] = $min_price;
                } else {
                    $query .= " AND c.daily_rate >= ?";
                    $params[] = $min_price;
                }
            }
            
            if ($max_price) {
                if ($this->use_pdo) {
                    $query .= " AND c.daily_rate <= :max_price";
                    $params[':max_price'] = $max_price;
                } else {
                    $query .= " AND c.daily_rate <= ?";
                    $params[] = $max_price;
                }
            }
            
            if ($search) {
                if ($this->use_pdo) {
                    $query .= " AND (c.make LIKE :search OR c.model LIKE :search OR c.description LIKE :search)";
                    $params[':search'] = "%$search%";
                } else {
                    $query .= " AND (c.make LIKE ? OR c.model LIKE ? OR c.description LIKE ?)";
                    $searchParam = "%$search%";
                    $params[] = $searchParam;
                    $params[] = $searchParam;
                    $params[] = $searchParam;
                }
            }
            
            $query .= " ORDER BY c.created_at DESC";
            
            // Get total count
            $total = 0;
            if ($this->use_pdo) {
                $count_query = str_replace("SELECT c.*, cc.name as category_name", "SELECT COUNT(*)", $query);
                $count_stmt = $this->conn->prepare($count_query);
                $count_stmt->execute($params);
                $total = $count_stmt->fetchColumn();
            } else {
                $count_query = str_replace("SELECT c.*, cc.name as category_name", "SELECT COUNT(*)", $query);
                $count_stmt = $this->conn->prepare($count_query);
                if (!empty($params)) {
                    $types = str_repeat('s', count($params));
                    $count_stmt->bind_param($types, ...$params);
                }
                $count_stmt->execute();
                $result = $count_stmt->get_result();
                $total = $result->fetch_row()[0];
                $count_stmt->close();
            }
            
            // Add pagination
            $query = $this->paginate($query, $page, $limit);
            
            $cars = [];
            if ($this->use_pdo) {
                $stmt = $this->conn->prepare($query);
                $stmt->execute($params);
                $cars = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $stmt = $this->conn->prepare($query);
                if (!empty($params)) {
                    $types = str_repeat('s', count($params));
                    $stmt->bind_param($types, ...$params);
                }
                $stmt->execute();
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $cars[] = $row;
                }
                $stmt->close();
            }
            
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
        } catch (Exception $e) {
            error_log("Error in getCars: " . $e->getMessage());
            $this->sendError('গাড়ি ফেচ করতে ব্যর্থ: ' . $e->getMessage(), 500);
        }
    }

    // Get single car by ID
    public function getCar($id) {
        try {
            $query = "SELECT c.*, cc.name as category_name 
                      FROM cars c 
                      LEFT JOIN car_categories cc ON c.category_id = cc.id 
                      WHERE c.id = :id";
            
            $stmt = $this->conn->prepare($query);
            $id = (int)$id; // Ensure ID is integer
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                $this->sendError('গাড়ি পাওয়া যায়নি', 404);
            }
            
            $car = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($car['features']) {
                $car['features'] = json_decode($car['features'], true);
            }
            
            // Get average rating
            $rating_query = "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
                             FROM reviews WHERE car_id = :car_id";
            $rating_stmt = $this->conn->prepare($rating_query);
            $rating_stmt->bindParam(':car_id', $id, PDO::PARAM_INT);
            $rating_stmt->execute();
            $rating_data = $rating_stmt->fetch(PDO::FETCH_ASSOC);
            
            $car['avg_rating'] = $rating_data['avg_rating'] ? round($rating_data['avg_rating'], 1) : 0;
            $car['review_count'] = (int)$rating_data['review_count'];
            
            $this->sendSuccess($car);
        } catch (Exception $e) {
            error_log("Error in getCar: " . $e->getMessage());
            $this->sendError('গাড়ি ফেচ করতে ব্যর্থ: ' . $e->getMessage(), 500);
        }
    }

    // Add new car (admin only)
    public function addCar() {
        try {
            $token = $this->getAuthHeader();
            
            // Debug: Log token info
            error_log("AddCar - Token: " . ($token ? 'Present' : 'Missing'));
            
            if (!$this->verifyToken($token)) {
                error_log("AddCar - Token verification failed");
                $this->sendError('অননুমোদিত', 401);
            }
            
            $data = $this->getRequestData();
            
            // Debug: Log received data
            error_log("AddCar - Received data: " . json_encode($data));
            
            // Validate required fields
            $this->validateRequired($data, ['make', 'model', 'year', 'license_plate', 'daily_rate']);
            
            // Sanitize input
            $data = $this->sanitizeInput($data);
            
            // Check if license plate already exists
            if ($this->use_pdo) {
                $check_query = "SELECT id FROM cars WHERE license_plate = :license_plate";
                $check_stmt = $this->conn->prepare($check_query);
                $license_plate = $data['license_plate'];
                $check_stmt->bindParam(':license_plate', $license_plate);
                $check_stmt->execute();
                
                if ($check_stmt->rowCount() > 0) {
                    $this->sendError('এই লাইসেন্স প্লেটের গাড়ি ইতিমধ্যে বিদ্যমান', 409);
                }
            } else {
                $check_query = "SELECT id FROM cars WHERE license_plate = ?";
                $check_stmt = $this->conn->prepare($check_query);
                $check_stmt->bind_param('s', $data['license_plate']);
                $check_stmt->execute();
                $result = $check_stmt->get_result();
                
                if ($result->num_rows > 0) {
                    $this->sendError('এই লাইসেন্স প্লেটের গাড়ি ইতিমধ্যে বিদ্যমান', 409);
                }
                $check_stmt->close();
            }
            
            // Prepare features JSON
            $features = null;
            if (isset($data['features'])) {
                if (is_array($data['features'])) {
                    $features = json_encode($data['features']);
                } else if (is_string($data['features']) && !empty($data['features'])) {
                    $featuresArray = array_map('trim', explode(',', $data['features']));
                    $featuresArray = array_filter($featuresArray, function($item) { return !empty($item); });
                    $features = json_encode($featuresArray);
                }
            }
            
            if ($this->use_pdo) {
                // PDO version
                $query = "INSERT INTO cars (make, model, year, color, license_plate, vin, category_id, daily_rate, 
                          mileage, fuel_type, transmission, seats, image_url, description, features) 
                          VALUES (:make, :model, :year, :color, :license_plate, :vin, :category_id, :daily_rate, 
                          :mileage, :fuel_type, :transmission, :seats, :image_url, :description, :features)";
                
                $stmt = $this->conn->prepare($query);
                
                // Define variables for binding
                $make = $data['make'];
                $model = $data['model'];
                $year = (int)$data['year'];
                $color = $data['color'] ?? null;
                $license_plate = $data['license_plate'];
                $vin = $data['vin'] ?? null;
                $category_id = isset($data['category_id']) ? (int)$data['category_id'] : null;
                $daily_rate = (float)$data['daily_rate'];
                $mileage = isset($data['mileage']) ? (int)$data['mileage'] : 0;
                $fuel_type = $data['fuel_type'] ?? 'petrol';
                $transmission = $data['transmission'] ?? 'manual';
                $seats = isset($data['seats']) ? (int)$data['seats'] : 5;
                $image_url = $data['image_url'] ?? null;
                $description = $data['description'] ?? null;
                
                // Bind parameters
                $stmt->bindParam(':make', $make);
                $stmt->bindParam(':model', $model);
                $stmt->bindParam(':year', $year, PDO::PARAM_INT);
                $stmt->bindParam(':color', $color);
                $stmt->bindParam(':license_plate', $license_plate);
                $stmt->bindParam(':vin', $vin);
                $stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
                $stmt->bindParam(':daily_rate', $daily_rate);
                $stmt->bindParam(':mileage', $mileage, PDO::PARAM_INT);
                $stmt->bindParam(':fuel_type', $fuel_type);
                $stmt->bindParam(':transmission', $transmission);
                $stmt->bindParam(':seats', $seats, PDO::PARAM_INT);
                $stmt->bindParam(':image_url', $image_url);
                $stmt->bindParam(':description', $description);
                $stmt->bindParam(':features', $features);
                
                if ($stmt->execute()) {
                    $car_id = $this->conn->lastInsertId();
                    error_log("AddCar - Success: Car ID " . $car_id);
                    $this->sendSuccess(['car_id' => $car_id], 'গাড়ি সফলভাবে যোগ করা হয়েছে');
                } else {
                    $errorInfo = $stmt->errorInfo();
                    error_log("AddCar - Database error: " . json_encode($errorInfo));
                    $this->sendError('গাড়ি যোগ করতে ব্যর্থ: ' . ($errorInfo[2] ?? 'অজানা ডাটাবেস ত্রুটি'), 500);
                }
            } else {
                // MySQLi version
                $query = "INSERT INTO cars (make, model, year, color, license_plate, vin, category_id, daily_rate, 
                          mileage, fuel_type, transmission, seats, image_url, description, features) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                
                $stmt = $this->conn->prepare($query);
                $color = $data['color'] ?? null;
                $vin = $data['vin'] ?? null;
                $category_id = isset($data['category_id']) ? (int)$data['category_id'] : null;
                $mileage = isset($data['mileage']) ? (int)$data['mileage'] : 0;
                $fuel_type = $data['fuel_type'] ?? 'petrol';
                $transmission = $data['transmission'] ?? 'manual';
                $seats = isset($data['seats']) ? (int)$data['seats'] : 5;
                $image_url = $data['image_url'] ?? null;
                $description = $data['description'] ?? null;
                
                $stmt->bind_param('ssisssidississs', 
                    $data['make'], 
                    $data['model'], 
                    $data['year'], 
                    $color, 
                    $data['license_plate'], 
                    $vin, 
                    $category_id, 
                    $data['daily_rate'], 
                    $mileage, 
                    $fuel_type, 
                    $transmission, 
                    $seats, 
                    $image_url, 
                    $description, 
                    $features
                );
                
                if ($stmt->execute()) {
                    $car_id = $this->conn->insert_id;
                    error_log("AddCar - Success: Car ID " . $car_id);
                    $this->sendSuccess(['car_id' => $car_id], 'গাড়ি সফলভাবে যোগ করা হয়েছে');
                } else {
                    error_log("AddCar - Database error: " . $stmt->error);
                    $this->sendError('গাড়ি যোগ করতে ব্যর্থ: ' . $stmt->error, 500);
                }
                $stmt->close();
            }
        } catch (Exception $e) {
            error_log("Exception in addCar: " . $e->getMessage());
            $this->sendError('সার্ভার ত্রুটি: ' . $e->getMessage(), 500);
        }
    }

    // Update car (admin only)
    public function updateCar($id) {
        try {
            $token = $this->getAuthHeader();
            
            if (!$this->verifyToken($token)) {
                $this->sendError('অননুমোদিত', 401);
            }
            
            $data = $this->getRequestData();
            $data = $this->sanitizeInput($data);
            
            // Build update query dynamically
            $fields = [];
            $params = [':id' => (int)$id];
            
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
                $this->sendError('আপডেটের জন্য কোনো বৈধ ফিল্ড নেই', 400);
            }
            
            $query = "UPDATE cars SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            
            if ($stmt->execute($params)) {
                $this->sendSuccess(null, 'গাড়ি সফলভাবে আপডেট করা হয়েছে');
            } else {
                $this->sendError('আপডেট ব্যর্থ', 500);
            }
        } catch (Exception $e) {
            error_log("Error in updateCar: " . $e->getMessage());
            $this->sendError('গাড়ি আপডেট করতে ব্যর্থ: ' . $e->getMessage(), 500);
        }
    }

    // Delete car (admin only)
    public function deleteCar($id) {
        try {
            $token = $this->getAuthHeader();
            
            if (!$this->verifyToken($token)) {
                $this->sendError('অননুমোদিত', 401);
            }
            
            // Check if car has active bookings
            $check_query = "SELECT id FROM bookings WHERE car_id = :car_id AND status IN ('confirmed', 'active')";
            $check_stmt = $this->conn->prepare($check_query);
            $car_id = (int)$id;
            $check_stmt->bindParam(':car_id', $car_id, PDO::PARAM_INT);
            $check_stmt->execute();
            
            if ($check_stmt->rowCount() > 0) {
                $this->sendError('সক্রিয় বুকিং থাকা গাড়ি ডিলিট করা যাবে না', 400);
            }
            
            $query = "DELETE FROM cars WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $car_id, PDO::PARAM_INT);
            
            if ($stmt->execute() && $stmt->rowCount() > 0) {
                $this->sendSuccess(null, 'গাড়ি সফলভাবে ডিলিট করা হয়েছে');
            } else {
                $this->sendError('গাড়ি পাওয়া যায়নি বা ডিলিট ব্যর্থ', 404);
            }
        } catch (Exception $e) {
            error_log("Error in deleteCar: " . $e->getMessage());
            $this->sendError('গাড়ি ডিলিট করতে ব্যর্থ: ' . $e->getMessage(), 500);
        }
    }

    // Get car categories
    public function getCategories() {
        try {
            if ($this->use_pdo) {
                $query = "SELECT * FROM car_categories ORDER BY name";
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
                $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $query = "SELECT * FROM car_categories ORDER BY name";
                $result = $this->conn->query($query);
                $categories = [];
                if ($result) {
                    while ($row = $result->fetch_assoc()) {
                        $categories[] = $row;
                    }
                }
            }
            
            $this->sendSuccess($categories);
        } catch (Exception $e) {
            error_log("Error in getCategories: " . $e->getMessage());
            $this->sendError('ক্যাটাগরি ফেচ করতে ব্যর্থ: ' . $e->getMessage(), 500);
        }
    }
}

// Handle API requests
try {
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
                        echo json_encode(['success' => false, 'error' => 'অ্যাকশন পাওয়া যায়নি']);
                        exit;
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
                echo json_encode(['success' => false, 'error' => 'গাড়ির আইডি প্রয়োজন']);
                exit;
            }
            break;
            
        case 'DELETE':
            if (isset($_GET['id'])) {
                $cars->deleteCar($_GET['id']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'গাড়ির আইডি প্রয়োজন']);
                exit;
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'মেথড অনুমোদিত নয়']);
            exit;
    }
} catch (Exception $e) {
    error_log("Uncaught exception in cars.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'ইন্টারনাল সার্ভার ত্রুটি',
        'message' => $e->getMessage()
    ]);
    exit;
} catch (Error $e) {
    error_log("Fatal error in cars.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'ফেটাল সার্ভার ত্রুটি',
        'message' => $e->getMessage()
    ]);
    exit;
}
?>