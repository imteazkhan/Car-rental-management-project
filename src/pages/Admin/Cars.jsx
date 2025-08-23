import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/Admin/DataTable';
import FormModal from '../../components/Admin/FormModal';
import { useNotification } from '../../components/Admin/NotificationProvider';
import API_URL from '../../config';

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { showSuccess, showError } = useNotification();

  // Fetch cars
  const fetchCars = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cars.php?page=${page}&limit=20`, {
        headers: {
          'Authorization': token
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCars(data.data.cars);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch cars');
      }
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load cars');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/cars.php?action=categories`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCars();
    fetchCategories();
  }, [fetchCars, fetchCategories]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCars(page);
  };

  // Add car
  const handleAddCar = async (formData) => {
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cars.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Car added successfully');
        setShowAddModal(false);
        fetchCars(currentPage);
      } else {
        showError(data.message || 'Failed to add car');
      }
    } catch (err) {
      console.error('Error adding car:', err);
      showError('Failed to add car');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit car
  const handleEditCar = (car) => {
    setEditingCar(car);
    setShowEditModal(true);
  };

  // Update car
  const handleUpdateCar = async (formData) => {
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cars.php?id=${editingCar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Car updated successfully');
        setShowEditModal(false);
        setEditingCar(null);
        fetchCars(currentPage);
      } else {
        showError(data.message || 'Failed to update car');
      }
    } catch (err) {
      console.error('Error updating car:', err);
      showError('Failed to update car');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete car
  const handleDeleteCar = async (car) => {
    if (!window.confirm(`Are you sure you want to delete ${car.make} ${car.model}?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cars.php?id=${car.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Car deleted successfully');
        fetchCars(currentPage);
      } else {
        showError(data.message || 'Failed to delete car');
      }
    } catch (err) {
      console.error('Error deleting car:', err);
      showError('Failed to delete car');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action, selectedIds) => {
    try {
      const token = localStorage.getItem('token');
      
      let endpoint = '';
      let payload = { action, ids: selectedIds };
      
      switch (action) {
        case 'update_status_available':
          payload.action = 'update_car_status';
          payload.status = 'available';
          break;
        case 'update_status_maintenance':
          payload.action = 'update_car_status';
          payload.status = 'maintenance';
          break;
        default:
          showError('Invalid bulk action');
          return;
      }
      
      const response = await fetch(`${API_URL}/admin.php?action=bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(data.message || 'Bulk action completed');
        fetchCars(currentPage);
      } else {
        showError(data.message || 'Bulk action failed');
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      showError('Bulk action failed');
    }
  };

  // Table columns
  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '60px',
      sortable: true
    },
    {
      key: 'make',
      label: 'Make',
      sortable: true
    },
    {
      key: 'model',
      label: 'Model',
      sortable: true
    },
    {
      key: 'year',
      label: 'Year',
      width: '80px',
      sortable: true
    },
    {
      key: 'license_plate',
      label: 'License Plate',
      width: '120px'
    },
    {
      key: 'daily_rate',
      label: 'Daily Rate',
      width: '100px',
      type: 'currency',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      type: 'status',
      filterable: true,
      sortable: true
    },
    {
      key: 'category_name',
      label: 'Category',
      width: '120px',
      filterable: true
    }
  ];

  // Form fields for add/edit
  const getFormFields = () => [
    {
      type: 'group',
      name: 'basic_info',
      columns: 'two',
      fields: [
        {
          name: 'make',
          label: 'Make',
          type: 'text',
          required: true,
          placeholder: 'Enter car make'
        },
        {
          name: 'model',
          label: 'Model',
          type: 'text',
          required: true,
          placeholder: 'Enter car model'
        }
      ]
    },
    {
      type: 'group',
      name: 'details',
      columns: 'three',
      fields: [
        {
          name: 'year',
          label: 'Year',
          type: 'number',
          required: true,
          min: 1900,
          max: new Date().getFullYear() + 1
        },
        {
          name: 'color',
          label: 'Color',
          type: 'text',
          placeholder: 'Enter car color'
        },
        {
          name: 'daily_rate',
          label: 'Daily Rate ($)',
          type: 'number',
          required: true,
          min: 0,
          step: 0.01
        }
      ]
    },
    {
      type: 'group',
      name: 'identification',
      columns: 'two',
      fields: [
        {
          name: 'license_plate',
          label: 'License Plate',
          type: 'text',
          required: true,
          placeholder: 'Enter license plate'
        },
        {
          name: 'vin',
          label: 'VIN',
          type: 'text',
          placeholder: 'Vehicle Identification Number'
        }
      ]
    },
    {
      name: 'category_id',
      label: 'Category',
      type: 'select',
      options: categories.map(cat => ({ value: cat.id, label: cat.name }))
    },
    {
      type: 'group',
      name: 'specifications',
      columns: 'three',
      fields: [
        {
          name: 'fuel_type',
          label: 'Fuel Type',
          type: 'select',
          options: [
            { value: 'petrol', label: 'Petrol' },
            { value: 'diesel', label: 'Diesel' },
            { value: 'electric', label: 'Electric' },
            { value: 'hybrid', label: 'Hybrid' }
          ],
          defaultValue: 'petrol'
        },
        {
          name: 'transmission',
          label: 'Transmission',
          type: 'select',
          options: [
            { value: 'manual', label: 'Manual' },
            { value: 'automatic', label: 'Automatic' }
          ],
          defaultValue: 'manual'
        },
        {
          name: 'seats',
          label: 'Seats',
          type: 'number',
          min: 1,
          max: 50,
          defaultValue: 5
        }
      ]
    },
    {
      name: 'mileage',
      label: 'Mileage',
      type: 'number',
      min: 0,
      placeholder: 'Current mileage'
    },
    {
      name: 'image_url',
      label: 'Image URL',
      type: 'url',
      placeholder: 'Enter image URL'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 4,
      placeholder: 'Enter car description'
    }
  ];

  // Bulk action buttons
  const bulkActions = [
    {
      action: 'update_status_available',
      label: 'Set Available',
      icon: 'fas fa-check',
      variant: 'btn-success'
    },
    {
      action: 'update_status_maintenance',
      label: 'Set Maintenance',
      icon: 'fas fa-wrench',
      variant: 'btn-warning'
    }
  ];

  return (
    <div className="cars-management">
      <DataTable
        title="Cars Management"
        data={cars}
        columns={columns}
        loading={loading}
        error={error}
        onAdd={() => setShowAddModal(true)}
        onEdit={handleEditCar}
        onDelete={handleDeleteCar}
        onBulkAction={handleBulkAction}
        searchable={true}
        filterable={true}
        sortable={true}
        selectable={true}
        actionButtons={bulkActions}
        pagination={pagination}
        onPageChange={handlePageChange}
        refreshAction={() => fetchCars(currentPage)}
      />

      {/* Add Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCar}
        title="Add New Car"
        fields={getFormFields()}
        loading={submitting}
        submitLabel="Add Car"
        size="large"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCar(null);
        }}
        onSubmit={handleUpdateCar}
        title="Edit Car"
        fields={getFormFields()}
        initialData={editingCar || {}}
        loading={submitting}
        submitLabel="Update Car"
        size="large"
      />
    </div>
  );
};

export default Cars;