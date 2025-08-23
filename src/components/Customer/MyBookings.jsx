import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Car, Clock, DollarSign, MapPin, Star, X } from 'lucide-react';
import API_URL from '../../config';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        ...(filterStatus && { status: filterStatus })
      });

      const response = await fetch(`${API_URL}/bookings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/bookings?id=${bookingId}&action=cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchBookings();
        alert('Booking cancelled successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('An error occurred while cancelling the booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const BookingDetailsModal = () => {
    if (!showDetailsModal || !selectedBooking) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Car Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Car Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                <img
                  src={selectedBooking.image_url || '/placeholder-car.jpg'}
                  alt={`${selectedBooking.make} ${selectedBooking.model}`}
                  className="w-20 h-20 object-cover rounded-md mr-4"
                />
                <div>
                  <h4 className="font-semibold text-lg">{selectedBooking.make} {selectedBooking.model}</h4>
                  <p className="text-gray-600">{selectedBooking.year}</p>
                  <p className="text-sm text-gray-500">Daily Rate: ${selectedBooking.daily_rate}</p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Booking Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedBooking.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedBooking.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                    <p className="text-sm text-gray-900">{selectedBooking.pickup_location || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
                    <p className="text-sm text-gray-900">{selectedBooking.dropoff_location || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="text-sm text-gray-900">${parseFloat(selectedBooking.total_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
                {selectedBooking.notes && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              {['pending', 'confirmed'].includes(selectedBooking.status) && (
                <button
                  onClick={() => {
                    cancelBooking(selectedBooking.id);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Cancel Booking
                </button>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center space-x-4">
          <label className="block text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-md"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={booking.image_url || '/placeholder-car.jpg'}
                    alt={`${booking.make} ${booking.model}`}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.make} {booking.model} {booking.year}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>${parseFloat(booking.total_amount).toFixed(2)}</span>
                    </div>
                    {booking.pickup_location && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{booking.pickup_location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </button>
                    
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">You haven't made any bookings yet.</p>
        </div>
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal />
    </div>
  );
};

export default MyBookings;
