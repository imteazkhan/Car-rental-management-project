<?php

// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// API Router - Main entry point for all API requests
require_once 'database/config.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Parse the URL to get the endpoint
$url_parts = parse_url($request_uri);
$path = $url_parts['path'];
error_log($path);

// Remove the base path (adjust this based on your server setup)
$base_path = 'http://localhost/car-rental-management-project/API/';
$endpoint = str_replace($base_path, '', $path);

// Route requests to appropriate API files
switch ($endpoint) {
    case 'auth':
    case 'auth/':
        require_once 'auth.php';
        break;
        
    case 'cars':
    case 'cars/':
        require_once 'cars.php';
        break;
        
    case 'bookings':
    case 'bookings/':
        require_once 'bookings.php';
        break;
        
    case 'payments':
    case 'payments/':
        require_once 'payments.php';
        break;
        
    case 'reviews':
    case 'reviews/':
        require_once 'reviews.php';
        break;
        
    case 'admin':
    case 'admin/':
        require_once 'admin.php';
        break;
        
    case '':
    case '/':
        // API documentation/status endpoint
        $response = [
            'success' => true,
            'message' => 'Car Rental Management API',
            'version' => '1.0.0',
            'endpoints' => [
                'auth' => [
                    'POST /auth?action=register' => 'User registration',
                    'POST /auth?action=login' => 'User login',
                    'GET /auth' => 'Get user profile',
                    'PUT /auth' => 'Update user profile'
                ],
                'cars' => [
                    'GET /cars' => 'Get all cars with filters',
                    'GET /cars?id={id}' => 'Get single car',
                    'GET /cars?action=categories' => 'Get car categories',
                    'POST /cars' => 'Add new car (admin)',
                    'PUT /cars?id={id}' => 'Update car (admin)',
                    'DELETE /cars?id={id}' => 'Delete car (admin)'
                ],
                'bookings' => [
                    'GET /bookings' => 'Get user bookings',
                    'GET /bookings?all=true' => 'Get all bookings (admin)',
                    'GET /bookings?id={id}' => 'Get booking details',
                    'POST /bookings' => 'Create new booking',
                    'PUT /bookings?id={id}' => 'Update booking status',
                    'PUT /bookings?id={id}&action=cancel' => 'Cancel booking'
                ],
                'payments' => [
                    'GET /payments' => 'Get payment history',
                    'GET /payments?all=true' => 'Get all payments (admin)',
                    'POST /payments' => 'Process payment',
                    'PUT /payments?id={id}&action=refund' => 'Refund payment (admin)'
                ],
                'reviews' => [
                    'GET /reviews?car_id={id}' => 'Get car reviews',
                    'GET /reviews' => 'Get user reviews',
                    'POST /reviews' => 'Add review',
                    'PUT /reviews?id={id}' => 'Update review',
                    'DELETE /reviews?id={id}' => 'Delete review'
                ],
                'admin' => [
                    'GET /admin?action=stats' => 'Dashboard statistics',
                    'GET /admin?action=revenue-chart' => 'Revenue chart data',
                    'GET /admin?action=car-utilization' => 'Car utilization data',
                    'GET /admin?action=users' => 'Get all users',
                    'POST /admin?action=maintenance' => 'Add maintenance record',
                    'PUT /admin?action=user-role&user_id={id}' => 'Update user role'
                ]
            ],
            'authentication' => 'Bearer token required for protected endpoints',
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        http_response_code(200);
        echo json_encode($response, JSON_PRETTY_PRINT);
        break;
        
    default:
        // 404 - Endpoint not found
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Endpoint not found',
            'requested_endpoint' => $endpoint,
            'available_endpoints' => ['auth', 'cars', 'bookings', 'payments', 'reviews', 'admin']
        ]);
        break;
}
?>
