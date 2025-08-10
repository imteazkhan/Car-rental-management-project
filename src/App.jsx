import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
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

import './App.css'

// Component to handle scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

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
    <Router>
      <ScrollToTop />
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
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
