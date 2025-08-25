<?php
define("API_URL", "http://localhost/car-rental-management-project/API");
$conn = new mysqli("localhost", "root", "", "car_rental");
//error handling
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}