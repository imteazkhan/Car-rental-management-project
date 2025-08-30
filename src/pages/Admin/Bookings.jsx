import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/Admin/DataTable';
import FormModal from '../../components/Admin/FormModal';
import Modal from '../../components/Admin/Modal';
import { useNotification } from '../../components/Admin/NotificationProvider';
import API_URL from '../../config';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { showSuccess, showError } = useNotification();

  // Fetch bookings
  const fetchBookings = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching admin bookings with token:', token ? 'Yes' : 'No');
      
      const response = await fetch(`${API_URL}/bookings.php?all=true&page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Admin bookings response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Admin bookings API response:', data);
      
      if (data.success) {
        setBookings(data.data.bookings || []);
        setPagination(data.data.pagination);
        console.log('Admin bookings loaded successfully:', data.data.bookings?.length || 0, 'bookings');
      } else {
        setError(data.message || 'Failed to fetch bookings');
        console.error('API returned error:', data.message);
      }
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
      setError('Failed to load bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBookings(page);
  };

  // View booking details
  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  // Update booking status
  const handleUpdateStatus = (booking) => {
    setSelectedBooking(booking);
    setShowStatusModal(true);
  };

  // Submit status update
  const handleStatusSubmit = async (formData) => {
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        showError('No authentication token found. Please login again.');
        return;
      }
      
      console.log('Updating booking status:', selectedBooking.booking_id, 'to:', formData.status);
      
      const response = await fetch(`${API_URL}/bookings.php?id=${selectedBooking.booking_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: formData.status })
      });
      
      console.log('Status update response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Status update API response:', data);
      
      if (data.success) {
        showSuccess('Booking status updated successfully');
        setShowStatusModal(false);
        setSelectedBooking(null);
        fetchBookings(currentPage);
      } else {
        showError(data.message || 'Failed to update booking status');
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      showError('Failed to update booking status: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action, selectedIds) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('No authentication token found. Please login again.');
        return;
      }
      
      let payload = { action, ids: selectedIds };
      
      switch (action) {
        case 'cancel_bookings':
          if (!window.confirm(`Are you sure you want to cancel ${selectedIds.length} bookings?`)) {
            return;
          }
          break;
        default:
          showError('Invalid bulk action');
          return;
      }
      
      console.log('Performing bulk action:', action, 'on:', selectedIds);
      
      const response = await fetch(`${API_URL}/admin.php?action=bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Bulk action response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Bulk action API response:', data);
      
      if (data.success) {
        showSuccess(data.message || 'Bulk action completed');
        fetchBookings(currentPage);
      } else {
        showError(data.message || 'Bulk action failed');
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      showError('Bulk action failed: ' + err.message);
    }
  };

  // Calculate booking duration
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Table columns
  const columns = [
    {
      key: 'booking_id',
      label: 'ID',
      width: '60px',
      sortable: true
    },
    {
      key: 'username',
      label: 'Customer',
      render: (value, row) => `${row.username} (${row.email})`,
      sortable: true
    },
    {
      key: 'car_name',
      label: 'Car',
      render: (value, row) => `${row.car_name} ${row.car_model}`,
      sortable: true
    },
    {
      key: 'start_date',
      label: 'Start Date',
      width: '110px',
      type: 'date',
      sortable: true
    },
    {
      key: 'end_date',
      label: 'End Date',
      width: '110px',
      type: 'date',
      sortable: true
    },
    {
      key: 'duration',
      label: 'Duration',
      width: '80px',
      render: (value, row) => `${calculateDuration(row.start_date, row.end_date)} days`
    },
    {
      key: 'total_price',
      label: 'Amount',
      width: '100px',
      type: 'currency',
      sortable: true
    },
    {
      key: 'booking_status',
      label: 'Status',
      width: '100px',
      type: 'status',
      filterable: true,
      sortable: true
    },
    {
      key: 'created_at',
      label: 'Created',
      width: '110px',
      type: 'date',
      sortable: true
    }
  ];

  // Status update form fields
  const statusFormFields = [
    {
      name: 'status',
      label: 'Booking Status',
      type: 'select',
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    }
  ];

  // Bulk action buttons
  const bulkActions = [
    {
      action: 'cancel_bookings',
      label: 'Cancel Bookings',
      icon: 'fas fa-times',
      variant: 'btn-danger'
    }
  ];

  // Additional action buttons for individual rows
  const rowActions = [
    {
      icon: 'fas fa-eye',
      label: 'View Details',
      onClick: handleViewDetails,
      variant: 'btn-info'
    },
    {
      icon: 'fas fa-edit',
      label: 'Update Status',
      onClick: handleUpdateStatus,
      variant: 'btn-warning',
      condition: (booking) => !['completed', 'cancelled'].includes(booking.status)
    }
  ];

  return (
    <div className="bookings-management">
      <DataTable
        title="Bookings Management"
        data={bookings}
        columns={columns}
        loading={loading}
        error={error}
        onBulkAction={handleBulkAction}
        searchable={true}
        filterable={true}
        sortable={true}
        selectable={true}
        actionButtons={[...bulkActions, ...rowActions]}
        pagination={pagination}
        onPageChange={handlePageChange}
        refreshAction={() => fetchBookings(currentPage)}
      />

      {/* Status Update Modal */}
      <FormModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedBooking(null);
        }}
        onSubmit={handleStatusSubmit}
        title="Update Booking Status"
        fields={statusFormFields}
        initialData={selectedBooking || {}}
        loading={submitting}
        submitLabel="Update Status"
        size="small"
      />

      {/* Booking Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedBooking(null);
        }}
        title="Booking Details"
        size="large"
      >
        {selectedBooking && (
          <div className="booking-details">
            <div className="details-grid">
              {/* Customer Information */}
              <div className="details-section">
                <h3 className="section-title">
                  <i className="fas fa-user"></i>
                  Customer Information
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Username:</label>
                    <span>{selectedBooking.username}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{selectedBooking.email}</span>
                  </div>
                </div>
              </div>

              {/* Car Information */}
              <div className="details-section">
                <h3 className="section-title">
                  <i className="fas fa-car"></i>
                  Car Information
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Car:</label>
                    <span>{selectedBooking.car_name} {selectedBooking.car_model}</span>
                  </div>
                  <div className="info-item">
                    <label>Price per day:</label>
                    <span>${selectedBooking.car_rent_price}</span>
                  </div>
                  <div className="info-item">
                    <label>Fuel Type:</label>
                    <span>{selectedBooking.car_fuel_type}</span>
                  </div>
                  <div className="info-item">
                    <label>Transmission:</label>
                    <span>{selectedBooking.car_transmission}</span>
                  </div>
                  <div className="info-item">
                    <label>Seats:</label>
                    <span>{selectedBooking.car_seats}</span>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="details-section">
                <h3 className="section-title">
                  <i className="fas fa-calendar"></i>
                  Booking Information
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Booking ID:</label>
                    <span>#{selectedBooking.booking_id}</span>
                  </div>
                  <div className="info-item">
                    <label>Start Date:</label>
                    <span>{new Date(selectedBooking.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <label>End Date:</label>
                    <span>{new Date(selectedBooking.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <label>Duration:</label>
                    <span>{calculateDuration(selectedBooking.start_date, selectedBooking.end_date)} days</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status-badge status-${selectedBooking.booking_status}`}>
                      {selectedBooking.booking_status}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Total Price:</label>
                    <span className="amount">${Number(selectedBooking.total_price).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .booking-details {
          padding: 0;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }

        .details-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
        }

        .details-section.full-width {
          grid-column: 1 / -1;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 15px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .info-grid {
          display: grid;
          gap: 12px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-item label {
          font-weight: 500;
          color: #6b7280;
          min-width: 120px;
        }

        .info-item span {
          color: #111827;
          text-align: right;
        }

        .amount {
          font-weight: 600;
          color: #059669;
          font-size: 1.1rem;
        }

        .notes-content {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          line-height: 1.6;
          color: #374151;
        }

        @media (max-width: 768px) {
          .details-grid {
            grid-template-columns: 1fr;
          }

          .info-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .info-item span {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default Bookings;