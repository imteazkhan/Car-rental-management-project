import { Link, useNavigate } from 'react-router-dom'
import './Navbar.css'
import { useState, useEffect } from 'react'
import { menu_icon, close_icon } from '../assets/assets'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/car_logo7.png'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()
  
  // Derive a display name from various possible backend/DB field conventions
  const displayName = user
    ? (
        user.name ||
        (user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || user.email)
      )
    : ''

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src={logo} alt="Car Rental Logo" className="logo-image"  />
        </Link>
        <div className="menu-icon" onClick={toggleMenu}>
          <img src={menuOpen ? close_icon : menu_icon} alt="menu icon" />
        </div>
        <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <a href="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</a>
          <Link to="/cars" className="nav-link" onClick={() => setMenuOpen(false)}>Cars</Link>
          <Link to="/my-bookings" className="nav-link" onClick={() => setMenuOpen(false)}>My Bookings</Link>
          <Link to="/list-your-car" className="nav-link" onClick={() => setMenuOpen(false)}>List My Car</Link>
          {user && user.role === 'admin' && (
            <Link to="/admin/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
          )}
          <div className="nav-auth-mobile">
            {user ? (
              <div className="user-dropdown-mobile">
                <button 
                  className="nav-link user-btn"
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                >
                  Logout
                </button>
                <span className="user-greeting">{displayName}</span>
              </div>
            ) : (
              <Link to="/login" className="nav-link nav-register" onClick={() => setMenuOpen(false)}>Login</Link>
            )}
          </div>
        </div>
        <div className="nav-auth">
          {user ? (
            <div className="user-dropdown">
              <button 
                className="nav-link user-btn"
                onClick={toggleDropdown}
              >
                {displayName}
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  {user && user.role === 'admin' && (
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/admin/dashboard');
                        setShowDropdown(false);
                      }}
                    >
                      Admin Dashboard
                    </button>
                  )}
                  <button 
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-link nav-register">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar