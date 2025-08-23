import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Homepage from './pages/Homepage'
import Cars from './pages/Cars'
import MyBookings from './pages/MyBookings'
import ListYourCar from './pages/ListYourCar'
import Login from './pages/Login'
import Register from './pages/Register'
import CarDetails from './pages/CarDetails'
import { NotificationProvider } from './components/Admin/NotificationProvider'

import './App.css'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Admin/Dashboard'
import Users from './pages/Admin/Users'
import AdminCars from './pages/Admin/Cars'
import AdminBookings from './pages/Admin/Bookings'
import AdminSettings from './pages/Admin/Settings'

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }, []);

  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/cars" element={<Cars />} />
                <Route path="/cardetails/:id" element={<CarDetails />} />

                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/list-your-car" element={<ListYourCar />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="users" element={<Users />} />
                  <Route path="cars" element={<AdminCars />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  )
}

export default App
