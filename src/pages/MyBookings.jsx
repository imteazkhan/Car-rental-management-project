import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MyBookings.css'
import API_URL from '../config';
import axios from 'axios'
import jsPDF from 'jspdf';


function MyBookings() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user bookings from API
  useEffect(() => {
    fetchBookings();
  }, []);

  

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Use AuthContext with localStorage fallback
      const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const currentToken = token || localStorage.getItem('token');
      
      console.log('Fetching bookings for user:', currentUser);
      console.log('Using token:', currentToken ? 'Yes' : 'No');
      
      if (!currentToken || !currentUser.id) {
        setError('Please login to view your bookings');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/bookings.php`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Bookings API response:', response.data);
      
      if (response.data.success) {
        setBookings(response.data.data.bookings || []);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [selectedBooking, setSelectedBooking] = useState(null)

  const getStatusColor = (booking_status) => {
    switch (booking_status) {
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
        const currentToken = token || localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/bookings.php?booking_id=${bookingId}&action=cancel`, {}, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          setBookings(bookings.map(booking => 
            booking.booking_id === bookingId 
              ? { ...booking, booking_status: 'cancelled' }
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

  const handleDownloadInvoice = async (bookingId) => {
    try {
      const currentToken = token || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/bookings.php?id=${bookingId}&action=invoice`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const invoiceData = response.data.data;
        
        // Generate PDF using jsPDF
        const pdf = new jsPDF();
        const booking = invoiceData.booking_details;
        const payment = invoiceData.payment_details;
        
        // Set up PDF styling
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        
        // Header
        pdf.text('CAR RENTAL INVOICE', 20, 30);
        
        // Invoice details
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Invoice Number: ${invoiceData.invoice_number}`, 20, 50);
        pdf.text(`Invoice Date: ${new Date(invoiceData.invoice_date).toLocaleDateString()}`, 20, 60);
        pdf.text(`Booking ID: #${booking.booking_id}`, 20, 70);
        
        // Customer Information
        pdf.setFont('helvetica', 'bold');
        pdf.text('Customer Information:', 20, 90);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Name: ${booking.username}`, 30, 105);
        pdf.text(`Email: ${booking.email}`, 30, 115);
        pdf.text(`Phone: ${booking.phone || 'N/A'}`, 30, 125);
        
        // Car Information
        pdf.setFont('helvetica', 'bold');
        pdf.text('Vehicle Information:', 20, 145);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Vehicle: ${booking.car_name} ${booking.car_model}`, 30, 160);
        pdf.text(`Fuel Type: ${booking.car_fuel_type || 'N/A'}`, 30, 170);
        pdf.text(`Transmission: ${booking.car_transmission || 'N/A'}`, 30, 180);
        pdf.text(`Seats: ${booking.car_seats || 'N/A'}`, 30, 190);
        
        // Rental Information
        pdf.setFont('helvetica', 'bold');
        pdf.text('Rental Information:', 20, 210);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Pick-up Date: ${new Date(booking.start_date).toLocaleDateString()}`, 30, 225);
        pdf.text(`Return Date: ${new Date(booking.end_date).toLocaleDateString()}`, 30, 235);
        pdf.text(`Total Days: ${booking.total_days} days`, 30, 245);
        pdf.text(`Status: ${booking.booking_status.toUpperCase()}`, 30, 255);
        
        // Pricing Information
        pdf.setFont('helvetica', 'bold');
        pdf.text('Pricing Details:', 20, 275);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Daily Rate: $${parseFloat(booking.car_rent_price).toFixed(2)}`, 30, 290);
        pdf.text(`Number of Days: ${booking.total_days}`, 30, 300);
        pdf.text(`Subtotal: $${(parseFloat(booking.car_rent_price) * booking.total_days).toFixed(2)}`, 30, 310);
        
        // Total
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(`TOTAL AMOUNT: $${parseFloat(booking.total_price).toFixed(2)}`, 30, 330);
        
        // Payment Information (if available)
        let footerY = 350;
        if (payment) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Payment Information:', 20, 350);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Payment Method: ${payment.payment_method || 'N/A'}`, 30, 365);
          pdf.text(`Transaction ID: ${payment.transaction_id || 'N/A'}`, 30, 375);
          pdf.text(`Payment Status: ${payment.status || 'N/A'}`, 30, 385);
          footerY = 410;
        }
        
        // Footer
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Thank you for choosing our car rental service!', 20, footerY);
        pdf.text('For any questions, please contact our customer service.', 20, footerY + 10);
        
        // Download the PDF
        pdf.save(`invoice-${invoiceData.invoice_number}-booking-${bookingId}.pdf`);
        
        alert('Invoice downloaded successfully!');
      } else {
        alert(response.data.message || 'Failed to fetch invoice');
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      alert('Failed to fetch invoice. Please try again.');
    }
  };

  const canCancel = (booking_status, startDate) => {
    const today = new Date()
    const start = new Date(startDate)
    const daysDiff = (start - today) / (1000 * 60 * 60 * 24)
    return booking_status === 'confirmed' && daysDiff > 1
  }

  const canModify = (booking_status, startDate) => {
    const today = new Date()
    const start = new Date(startDate)
    const daysDiff = (start - today) / (1000 * 60 * 60 * 24)
    return (booking_status === 'confirmed' || booking_status === 'pending') && daysDiff > 1
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
              <div key={booking.booking_id} className="booking-card" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="booking-header">
                  <div className="booking-id">Booking #{booking.booking_id}</div>
                  <div
                    className="booking-status"
                    style={{ backgroundColor: getStatusColor(booking.booking_status) }}
                  >
                    {(booking.booking_status || booking.status).toUpperCase()}
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
                        Total: ${booking.total_price || booking.totalAmount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="booking-actions">
                  {canModify(booking.booking_status, booking.start_date || booking.startDate) && (
                    <button
                      className="modify-btn"
                      onClick={() => handleModifyBooking(booking.booking_id)}
                    >
                      Modify
                    </button>
                  )}
                  {canCancel(booking.booking_status, booking.start_date || booking.startDate) && (
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelBooking(booking.booking_id)}
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
                  <button
                    className="download-invoice-btn"
                    onClick={() => handleDownloadInvoice(booking.booking_id)}
                  >
                    Download Invoice
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
                <div className="booking-status-badge" style={{ backgroundColor: getStatusColor(selectedBooking.booking_status) }}>
                  {(selectedBooking.booking_status || selectedBooking.status).toUpperCase()}
                </div>
              </div>

              <div className="modal-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Booking ID:</span>
                  <span className="detail-value">#{selectedBooking.booking_id}</span>
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
                  <span className="detail-value">${selectedBooking.total_price || selectedBooking.totalAmount}</span>
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