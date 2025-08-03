import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './MyBookings.css'

import car_image2 from '../assets/car_image2.png'
import car_image3 from '../assets/car_image3.png'
import car_image4 from '../assets/car_image4.png'

function MyBookings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([
    {
      id: 1,
      carName: 'Toyota Camry 2023',
      carImage: car_image2,
      startDate: '2025-02-15',
      endDate: '2025-02-18',
      totalDays: 3,
      pricePerDay: 45,
      totalAmount: 135,
      status: 'confirmed',
      bookingDate: '2025-01-28'
    },
    {
      id: 2,
      carName: 'BMW X5 2023',
      carImage: car_image3,
      startDate: '2025-03-10',
      endDate: '2025-03-15',
      totalDays: 5,
      pricePerDay: 85,
      totalAmount: 425,
      status: 'pending',
      bookingDate: '2025-01-30'
    },
    {
      id: 3,
      carName: 'Honda Civic 2023',
      carImage: car_image4,
      startDate: '2025-01-20',
      endDate: '2025-01-22',
      totalDays: 2,
      pricePerDay: 40,
      totalAmount: 80,
      status: 'completed',
      bookingDate: '2025-01-15'
    }
  ]);

  useEffect(() => {
    if (location.state && location.state.newBooking) {
      setBookings(prevBookings => [location.state.newBooking, ...prevBookings]);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const [selectedBooking, setSelectedBooking] = useState(null)

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#27ae60'
      case 'pending': return '#f39c12'
      case 'completed': return '#3498db'
      case 'cancelled': return '#e74c3c'
      default: return '#95a5a6'
    }
  }

  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(bookings.filter(booking => booking.id !== bookingId));
    }
  }

  const handleModifyBooking = (bookingId) => {
    alert(`Redirecting to modify booking ${bookingId}...`)
  }

  const canCancel = (status, startDate) => {
    const today = new Date()
    const start = new Date(startDate)
    const daysDiff = (start - today) / (1000 * 60 * 60 * 24)
    return status === 'confirmed' && daysDiff > 1
  }

  const canModify = (status, startDate) => {
    const today = new Date()
    const start = new Date(startDate)
    const daysDiff = (start - today) / (1000 * 60 * 60 * 24)
    return (status === 'confirmed' || status === 'pending') && daysDiff > 1
  }

  return (
    <div className="my-bookings">
      <div className="container">
        <h1>My Bookings</h1>
        
        {bookings.length === 0 ? (
          <div className="no-bookings">
            <h3>No bookings found</h3>
            <p>You haven't made any bookings yet.</p>
            <a href="/cars" className="browse-cars-btn">Browse Cars</a>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <div className="booking-id">Booking #{booking.id}</div>
                  <div 
                    className="booking-status"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  >
                    {booking.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="booking-content">
                  <div className="car-info">
                    <img src={booking.carImage} alt={booking.carName} />
                    <div className="car-details">
                      <h3>{booking.carName}</h3>
                      <p className="booking-date">Booked on: {new Date(booking.bookingDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="rental-details">
                    <div className="date-range">
                      <div className="date-item">
                        <label>Pick-up Date:</label>
                        <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="date-item">
                        <label>Return Date:</label>
                        <span>{new Date(booking.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="date-item">
                        <label>Total Days:</label>
                        <span>{booking.totalDays} days</span>
                      </div>
                    </div>
                    
                    <div className="pricing">
                      <div className="price-breakdown">
                        <span>${booking.pricePerDay}/day × {booking.totalDays} days</span>
                      </div>
                      <div className="total-amount">
                        Total: ${booking.totalAmount}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="booking-actions">
                  {canModify(booking.status, booking.startDate) && (
                    <button 
                      className="modify-btn"
                      onClick={() => handleModifyBooking(booking.id)}
                    >
                      Modify
                    </button>
                  )}
                  {canCancel(booking.status, booking.startDate) && (
                    <button 
                      className="cancel-btn"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    className="details-btn"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Booking Details */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Booking Details</h2>
            <img src={selectedBooking.carImage} alt={selectedBooking.carName} style={{maxWidth: '100%', borderRadius: '8px'}} />
            <h3>{selectedBooking.carName}</h3>
            <p><strong>Status:</strong> {selectedBooking.status}</p>
            <p><strong>Booked on:</strong> {new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
            <p><strong>Pick-up:</strong> {new Date(selectedBooking.startDate).toLocaleDateString()}</p>
            <p><strong>Return:</strong> {new Date(selectedBooking.endDate).toLocaleDateString()}</p>
            <p><strong>Total Days:</strong> {selectedBooking.totalDays}</p>
            <p><strong>Price per Day:</strong> ${selectedBooking.pricePerDay}</p>
            <p><strong>Total Amount:</strong> ${selectedBooking.totalAmount}</p>
            <button onClick={() => setSelectedBooking(null)} className="close-modal-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyBookings;