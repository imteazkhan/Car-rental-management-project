<?php
define("API_URL", "https://coders64.xyz/imteaz/car-rental/api/");
$conn = new mysqli("localhost", "coders64_common", "123Common456", "coders64_car_rental");
//error handling
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}