import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './MyBookings.css'
import API_URL from '../config';
import axios from 'axios'


function MyBookings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user bookings from API
  useEffect(() => {
    fetchBookings();
  }, []);

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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user.id) {
        setError('Please login to view your bookings');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/bookings.php`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setBookings(response.data.data.bookings || []);
      } else {
        setError(response.data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/bookings.php?id=${bookingId}&action=cancel`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          setBookings(bookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: 'cancelled' }
              : booking
          ));
          alert('Booking cancelled successfully!');
        } else {
          alert(response.data.message || 'Failed to cancel booking');
        }
      } catch (err) {
        console.error('Error cancelling booking:', err);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  }

  const handleModifyBooking = (bookingId) => {
    navigate(`/modify-booking/${bookingId}`);
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
        <h1 data-aos="fade-down">My Bookings</h1>

        {loading ? (
          <div className="loading" data-aos="fade-up">
            <p>Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="error" data-aos="fade-up">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={fetchBookings} className="retry-btn">Retry</button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="no-bookings" data-aos="fade-up">
            <h3>No bookings found</h3>
            <p>You haven't made any bookings yet.</p>
            <a href="/cars" className="browse-cars-btn">Browse Cars</a>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking, index) => (
              <div key={booking.id} className="booking-card" data-aos="fade-up" data-aos-delay={index * 100}>
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
                    <img src={booking.car_image || booking.carImage} alt={booking.car_name || booking.carName} />
                    <div className="car-details">
                      <h3>{booking.car_name || booking.carName}</h3>
                      <p className="booking-date">Booked on: {new Date(booking.booking_date || booking.bookingDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="rental-details">
                    <div className="date-range">
                      <div className="date-item">
                        <label>Pick-up Date:</label>
                        <span>{new Date(booking.start_date || booking.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="date-item">
                        <label>Return Date:</label>
                        <span>{new Date(booking.end_date || booking.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="date-item">
                        <label>Total Days:</label>
                        <span>{booking.total_days || booking.totalDays} days</span>
                      </div>
                    </div>

                    <div className="pricing">
                      <div className="price-breakdown">
                        <span>${booking.price_per_day || booking.pricePerDay}/day × {booking.total_days || booking.totalDays} days</span>
                      </div>
                      <div className="total-amount">
                        Total: ${booking.total_amount || booking.totalAmount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="booking-actions">
                  {canModify(booking.status, booking.start_date || booking.startDate) && (
                    <button
                      className="modify-btn"
                      onClick={() => handleModifyBooking(booking.id)}
                    >
                      Modify
                    </button>
                  )}
                  {canCancel(booking.status, booking.start_date || booking.startDate) && (
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
                  src={selectedBooking.car_image || selectedBooking.carImage}
                  alt={selectedBooking.car_name || selectedBooking.carName}
                />
              </div>

              <div className="modal-info">
                <h3>{selectedBooking.car_name || selectedBooking.carName}</h3>
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
                  <span className="detail-value">{new Date(selectedBooking.booking_date || selectedBooking.bookingDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pick-up Date:</span>
                  <span className="detail-value">{new Date(selectedBooking.start_date || selectedBooking.startDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Return Date:</span>
                  <span className="detail-value">{new Date(selectedBooking.end_date || selectedBooking.endDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Days:</span>
                  <span className="detail-value">{selectedBooking.total_days || selectedBooking.totalDays} days</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Price per Day:</span>
                  <span className="detail-value">${selectedBooking.price_per_day || selectedBooking.pricePerDay}</span>
                </div>
                <div className="detail-item total-amount">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value">${selectedBooking.total_amount || selectedBooking.totalAmount}</span>
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