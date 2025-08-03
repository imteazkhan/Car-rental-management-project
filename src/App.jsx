import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Homepage from './pages/Homepage'
import Cars from './pages/Cars'
import MyBookings from './pages/MyBookings'
import ListYourCar from './pages/ListYourCar'
import Login from './pages/Login'
import Register from './pages/Register'
import CarDetails from './pages/CarDetails'

import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetails />} />
            
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/list-your-car" element={<ListYourCar />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
