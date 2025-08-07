import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './MyBookings.css'

function MyBookings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (location.state && location.state.newBooking) {
      const newBooking = location.state.newBooking;

      // Check if booking already exists to prevent duplicates
      setBookings(prevBookings => {
        const bookingExists = prevBookings.some(booking => booking.id === newBooking.id);
        if (!bookingExists) {
          return [newBooking, ...prevBookings];
        }
        return prevBookings;
      });

      // Clear the location state to prevent re-adding on refresh
      navigate(location.pathname, { replace: true, state: null });
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
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedBooking(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-car-image">
                <img
                  src={selectedBooking.carImage}
                  alt={selectedBooking.carName}
                />
              </div>

              <div className="modal-info">
                <h3>{selectedBooking.carName}</h3>
                <div className="booking-status-badge" style={{ backgroundColor: getStatusColor(selectedBooking.status) }}>
                  {selectedBooking.status.toUpperCase()}
                </div>
              </div>

              <div className="modal-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Booking ID:</span>
                  <span className="detail-value">#{selectedBooking.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Booked on:</span>
                  <span className="detail-value">{new Date(selectedBooking.bookingDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pick-up Date:</span>
                  <span className="detail-value">{new Date(selectedBooking.startDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Return Date:</span>
                  <span className="detail-value">{new Date(selectedBooking.endDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Days:</span>
                  <span className="detail-value">{selectedBooking.totalDays} days</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Price per Day:</span>
                  <span className="detail-value">${selectedBooking.pricePerDay}</span>
                </div>
                <div className="detail-item total-amount">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value">${selectedBooking.totalAmount}</span>
                </div>
              </div>

              {selectedBooking.features && (
                <div className="modal-features">
                  <h4>Car Features:</h4>
                  <div className="features-list">
                    {selectedBooking.features.map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyBookings;