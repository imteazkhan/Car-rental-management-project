import { Link } from 'react-router-dom'
import { useState } from 'react'
import './Navbar.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <a href="/" className="nav-logo">
          Car Rental
        </a>

        {/* Hamburger Menu Button */}
        <button
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
          <Link to="/cars" className="nav-link" onClick={closeMenu}>Cars</Link>
          <Link to="/my-bookings" className="nav-link" onClick={closeMenu}>My Bookings</Link>
          <Link to="/list-your-car" className="nav-link" onClick={closeMenu}>List My Car</Link>
          <div className="nav-auth">
            <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
            <Link to="/register" className="nav-link nav-register" onClick={closeMenu}>Register</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar