import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Car Rental</h3>
          <p>Your trusted car rental service. Quality vehicles, affordable prices, exceptional service.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/cars">Available Cars</a></li>
            <li><a href="/list-your-car">List My Car</a></li>
            <li><a href="/my-bookings">My Bookings</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Policies</h4>
          <ul>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="/cancellation">Cancellation Policy</a></li>
            <li><a href="/insurance">Insurance Policy</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Contact Info</h4>
          <p>📧 info@car_rental.com</p>
          <p>📞 +880 123-4567</p>
          <p>📍 123 Rental Street, Mirpur, Dhaka-1216</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 Car Rental. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer