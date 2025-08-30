<?php
require_once 'BaseAPI.php';

class SettingsAPI extends BaseAPI {
    protected function handleGet() {
        $sql = "SELECT * FROM settings";
        $result = $this->conn->query($sql);
        $settings = [];
        while ($row = $result->fetch_assoc()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        $this->sendResponse($settings);
    }

    protected function handlePost() {
        $data = $this->getDecodedBody();
        foreach ($data as $key => $value) {
            $sql = "UPDATE settings SET setting_value = ? WHERE setting_key = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param('ss', $value, $key);
            $stmt->execute();
        }
        $this->sendResponse(['success' => true, 'message' => 'Settings updated successfully']);
    }
}

(new SettingsAPI())->handleRequest();
