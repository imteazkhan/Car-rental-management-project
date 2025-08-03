import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Car Rental
        </Link>
        <div className="nav-menu">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/cars" className="nav-link">Cars</Link>
          <Link to="/my-bookings" className="nav-link">My Bookings</Link>
          <Link to="/list-your-car" className="nav-link">List My Car</Link>
          <div className="nav-auth">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link nav-register">Register</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar