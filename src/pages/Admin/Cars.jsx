import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
      if (!token) {
        throw new Error('কোনো অথেনটিকেশন টোকেন পাওয়া যায়নি');
      }
      
      const response = await fetch(`${API_URL}/cars.php?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('সার্ভার থেকে অবৈধ রেসপন্স পাওয়া গেছে');
      }
      
      if (data.success) {
        setCars(data.data.cars);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'গাড়ি লোড করতে ব্যর্থ');
      }
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('গাড়ি লোড করতে ব্যর্থ: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('কোনো অথেনটিকেশন টোকেন পাওয়া যায়নি');
      }
      
      const response = await fetch(`${API_URL}/cars.php?action=categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('সার্ভার থেকে অবৈধ রেসপন্স পাওয়া গেছে');
      }
      
      if (data.success) {
        setCategories(data.data);
      } else {
        showError(data.message || 'ক্যাটাগরি লোড করতে ব্যর্থ');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      showError('ক্যাটাগরি লোড করতে ব্যর্থ: ' + err.message);
    }
  }, [API_URL, showError]);

  useEffect(() => {
    fetchCars();
    fetchCategories();
  }, [fetchCars, fetchCategories]);

  // Stable refresh function
  const refreshData = useCallback(() => {
    fetchCars(currentPage);
  }, [currentPage, fetchCars]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCars(page);
  };

  // Add car
  const handleAddCar = useCallback(async (formData) => {
    try {
      setSubmitting(true);
      
      // Process features field
      const processedData = { ...formData };
      if (processedData.features && typeof processedData.features === 'string') {
        processedData.features = processedData.features
          .split(',')
          .map(feature => feature.trim())
          .filter(feature => feature.length > 0);
      }
      
      // Ensure numeric fields are properly typed
      if (processedData.year) processedData.year = parseInt(processedData.year);
      if (processedData.daily_rate) processedData.daily_rate = parseFloat(processedData.daily_rate);
      if (processedData.mileage) processedData.mileage = parseInt(processedData.mileage) || 0;
      if (processedData.seats) processedData.seats = parseInt(processedData.seats) || 5;
      if (processedData.category_id) processedData.category_id = parseInt(processedData.category_id);
      
      // Validate category_id
      if (!processedData.category_id) {
        throw new Error('ক্যাটাগরি নির্বাচন করা প্রয়োজন');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('কোনো অথেনটিকেশন টোকেন পাওয়া যায়নি');
      }
      
      const response = await fetch(`${API_URL}/cars.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(processedData)
      });
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response that failed to parse:', responseText);
        showError('সার্ভার থেকে অবৈধ রেসপন্স পাওয়া গেছে');
        return;
      }
      
      if (response.ok && data.success) {
        showSuccess(data.message || 'গাড়ি সফলভাবে যোগ করা হয়েছে');
        setShowAddModal(false);
        fetchCars(currentPage);
      } else {
        showError(data.message || data.error || 'গাড়ি যোগ করতে ব্যর্থ');
      }
    } catch (err) {
      console.error('Error adding car:', err);
      showError(`গাড়ি যোগ করতে ব্যর্থ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }, [currentPage, showSuccess, showError, API_URL]);

  // Edit car
  const handleEditCar = useCallback((car) => {
    setEditingCar(car);
    setShowEditModal(true);
  }, []);

  // Update car
  const handleUpdateCar = useCallback(async (formData) => {
    try {
      setSubmitting(true);
      
      // Process features field
      const processedData = { ...formData };
      if (processedData.features && typeof processedData.features === 'string') {
        processedData.features = processedData.features
          .split(',')
          .map(feature => feature.trim())
          .filter(feature => feature.length > 0);
      }
      
      // Ensure numeric fields are properly typed
      if (processedData.year) processedData.year = parseInt(processedData.year);
      if (processedData.daily_rate) processedData.daily_rate = parseFloat(processedData.daily_rate);
      if (processedData.mileage) processedData.mileage = parseInt(processedData.mileage) || 0;
      if (processedData.seats) processedData.seats = parseInt(processedData.seats) || 5;
      if (processedData.category_id) processedData.category_id = parseInt(processedData.category_id);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('কোনো অথেনটিকেশন টোকেন পাওয়া যায়নি');
      }
      
      const response = await fetch(`${API_URL}/cars.php?id=${editingCar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(processedData)
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        showError('সার্ভার থেকে অবৈধ রেসপন্স পাওয়া গেছে');
        return;
      }
      
      if (response.ok && data.success) {
        showSuccess(data.message || 'গাড়ি সফলভাবে আপডেট করা হয়েছে');
        setShowEditModal(false);
        setEditingCar(null);
        fetchCars(currentPage);
      } else {
        showError(data.message || 'গাড়ি আপডেট করতে ব্যর্থ');
      }
    } catch (err) {
      console.error('Error updating car:', err);
      showError('গাড়ি আপডেট করতে ব্যর্থ');
    } finally {
      setSubmitting(false);
    }
  }, [editingCar, currentPage, showSuccess, showError, API_URL]);

  // Delete car
  const handleDeleteCar = useCallback(async (car) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে ${car.make} ${car.model} ডিলিট করতে চান?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('কোনো অথেনটিকেশন টোকেন পাওয়া যায়নি');
      }
      
      const response = await fetch(`${API_URL}/cars.php?id=${car.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        showError('সার্ভার থেকে অবৈধ রেসপন্স পাওয়া গেছে');
        return;
      }
      
      if (response.ok && data.success) {
        showSuccess(data.message || 'গাড়ি সফলভাবে ডিলিট করা হয়েছে');
        fetchCars(currentPage);
      } else {
        showError(data.message || 'গাড়ি ডিলিট করতে ব্যর্থ');
      }
    } catch (err) {
      console.error('Error deleting car:', err);
      showError('গাড়ি ডিলিট করতে ব্যর্থ');
    }
  }, [currentPage, showSuccess, showError, API_URL]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action, selectedIds) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('কোনো অথেনটিকেশন টোকেন পাওয়া যায়নি');
      }
      
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
          showError('ইনভ্যালিড বাল্ক অ্যাকশন');
          return;
      }
      
      const response = await fetch(`${API_URL}/admin.php?action=bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        showError('সার্ভার থেকে অবৈধ রেসপন্স পাওয়া গেছে');
        return;
      }
      
      if (response.ok && data.success) {
        showSuccess(data.message || 'বাল্ক অ্যাকশন সফলভাবে সম্পন্ন');
        fetchCars(currentPage);
      } else {
        showError(data.message || 'বাল্ক অ্যাকশন ব্যর্থ');
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      showError('বাল্ক অ্যাকশন ব্যর্থ');
    }
  }, [currentPage, showSuccess, showError, API_URL]);

  // Table columns
  const columns = useMemo(() => [
    {
      key: 'id',
      label: 'আইডি',
      width: '60px',
      sortable: true
    },
    {
      key: 'make',
      label: 'মেক',
      sortable: true
    },
    {
      key: 'model',
      label: 'মডেল',
      sortable: true
    },
    {
      key: 'year',
      label: 'বছর',
      width: '80px',
      sortable: true
    },
    {
      key: 'license_plate',
      label: 'লাইসেন্স প্লেট',
      width: '120px'
    },
    {
      key: 'daily_rate',
      label: 'দৈনিক রেট',
      width: '100px',
      type: 'currency',
      sortable: true
    },
    {
      key: 'status',
      label: 'স্ট্যাটাস',
      width: '100px',
      type: 'status',
      filterable: true,
      sortable: true
    },
    {
      key: 'category_name',
      label: 'ক্যাটাগরি',
      width: '120px',
      filterable: true
    }
  ], []);

  // Form fields for add/edit
  const formFields = useMemo(() => [
    {
      type: 'group',
      name: 'basic_info',
      columns: 'two',
      fields: [
        {
          name: 'make',
          label: 'মেক',
          type: 'text',
          required: true,
          placeholder: 'গাড়ির মেক লিখুন'
        },
        {
          name: 'model',
          label: 'মডেল',
          type: 'text',
          required: true,
          placeholder: 'গাড়ির মডেল লিখুন'
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
          label: 'বছর',
          type: 'number',
          required: true,
          min: 1900,
          max: new Date().getFullYear() + 1
        },
        {
          name: 'color',
          label: 'রঙ',
          type: 'text',
          placeholder: 'গাড়ির রঙ লিখুন'
        },
        {
          name: 'daily_rate',
          label: 'দৈনিক রেট ($)',
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
          label: 'লাইসেন্স প্লেট',
          type: 'text',
          required: true,
          placeholder: 'লাইসেন্স প্লেট লিখুন'
        },
        {
          name: 'vin',
          label: 'VIN',
          type: 'text',
          placeholder: 'গাড়ির VIN নম্বর'
        }
      ]
    },
    {
      name: 'category_id',
      label: 'ক্যাটাগরি',
      type: 'select',
      options: categories.map(cat => ({ value: cat.id, label: cat.name })),
      required: true, // Make category_id required
      placeholder: 'একটি ক্যাটাগরি নির্বাচন করুন'
    },
    {
      type: 'group',
      name: 'specifications',
      columns: 'three',
      fields: [
        {
          name: 'fuel_type',
          label: 'জ্বালানির ধরন',
          type: 'select',
          options: [
            { value: 'petrol', label: 'পেট্রোল' },
            { value: 'diesel', label: 'ডিজেল' },
            { value: 'electric', label: 'ইলেকট্রিক' },
            { value: 'hybrid', label: 'হাইব্রিড' }
          ],
          defaultValue: 'petrol'
        },
        {
          name: 'transmission',
          label: 'ট্রান্সমিশন',
          type: 'select',
          options: [
            { value: 'manual', label: 'ম্যানুয়াল' },
            { value: 'automatic', label: 'অটোমেটিক' }
          ],
          defaultValue: 'manual'
        },
        {
          name: 'seats',
          label: 'সিট',
          type: 'number',
          min: 1,
          max: 50,
          defaultValue: 5
        }
      ]
    },
    {
      name: 'mileage',
      label: 'মাইলেজ',
      type: 'number',
      min: 0,
      placeholder: 'বর্তমান মাইলেজ',
      defaultValue: 0
    },
    {
      name: 'image_url',
      label: 'ইমেজ URL',
      type: 'url',
      placeholder: 'ইমেজ URL লিখুন'
    },
    {
      name: 'description',
      label: 'বিবরণ',
      type: 'textarea',
      rows: 4,
      placeholder: 'গাড়ির বিবরণ লিখুন'
    },
    {
      name: 'features',
      label: 'ফিচার্স (কমা দিয়ে আলাদা করুন)',
      type: 'textarea',
      rows: 2,
      placeholder: 'যেমন, এয়ার কন্ডিশনিং, GPS, ব্লুটুথ, ব্যাকআপ ক্যামেরা',
      help: 'কমা দিয়ে ফিচার্স আলাদা করুন'
    }
  ], [categories]);

  // Bulk action buttons
  const bulkActions = useMemo(() => [
    {
      action: 'update_status_available',
      label: 'উপলব্ধ করুন',
      icon: 'fas fa-check',
      variant: 'btn-success'
    },
    {
      action: 'update_status_maintenance',
      label: 'মেইনটেন্যান্সে রাখুন',
      icon: 'fas fa-wrench',
      variant: 'btn-warning'
    }
  ], []);

  return (
    <div className="cars-management">
      <DataTable
        title="গাড়ি ব্যবস্থাপনা"
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
        refreshAction={refreshData}
      />

      {/* Add Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCar}
        title="নতুন গাড়ি যোগ করুন"
        fields={formFields}
        loading={submitting}
        submitLabel="গাড়ি যোগ করুন"
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
        title="গাড়ি এডিট করুন"
        fields={formFields}
        initialData={editingCar || {}}
        loading={submitting}
        submitLabel="গাড়ি আপডেট করুন"
        size="large"
      />
    </div>
  );
};

export default Cars;