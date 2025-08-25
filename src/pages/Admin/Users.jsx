import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/Admin/DataTable';
import FormModal from '../../components/Admin/FormModal';
import { useNotification } from '../../components/Admin/NotificationProvider';
import API_URL from '../../config';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { showSuccess, showError } = useNotification();

  // Fetch users
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin.php?action=users&page=${page}&limit=20`, {
        headers: {
          'Authorization': token
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers(page);
  };

  // Add user
  const handleAddUser = async (formData) => {
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin.php?action=user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(formData)
      });
      
      // Debug: Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response that failed to parse:', responseText);
        showError(`Server returned invalid response: ${responseText.substring(0, 100)}...`);
        return;
      }
      
      if (data.success) {
        showSuccess('User created successfully');
        setShowAddModal(false);
        fetchUsers(currentPage);
      } else {
        showError(data.message || data.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      showError(`Failed to create user: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  // Update user
  const handleUpdateUser = async (formData) => {
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin.php?action=user&user_id=${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('User updated successfully');
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers(currentPage);
      } else {
        showError(data.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      showError('Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.first_name} ${user.last_name}?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin.php?action=user&user_id=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('User deleted successfully');
        fetchUsers(currentPage);
      } else {
        showError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      showError('Failed to delete user');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action, selectedIds) => {
    try {
      const token = localStorage.getItem('token');
      
      let payload = { action, ids: selectedIds };
      
      switch (action) {
        case 'promote_to_admin':
          payload.action = 'update_user_role';
          payload.role = 'admin';
          break;
        case 'demote_to_customer':
          payload.action = 'update_user_role';
          payload.role = 'customer';
          break;
        case 'delete_users':
          if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) {
            return;
          }
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
        fetchUsers(currentPage);
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
      key: 'username',
      label: 'Username',
      sortable: true
    },
    {
      key: 'first_name',
      label: 'First Name',
      sortable: true
    },
    {
      key: 'last_name',
      label: 'Last Name',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '120px'
    },
    {
      key: 'role',
      label: 'Role',
      width: '100px',
      type: 'status',
      filterable: true,
      sortable: true
    },
    {
      key: 'created_at',
      label: 'Created',
      width: '120px',
      type: 'date',
      sortable: true
    }
  ];

  // Form fields for add/edit
  const getFormFields = () => [
    {
      type: 'group',
      name: 'credentials',
      columns: 'two',
      fields: [
        {
          name: 'username',
          label: 'Username',
          type: 'text',
          required: true,
          placeholder: 'Enter username',
          validation: {
            pattern: '^[a-zA-Z0-9_]{3,20}$',
            message: 'Username must be 3-20 characters, letters, numbers, and underscores only'
          }
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          placeholder: 'Enter email address'
        }
      ]
    },
    {
      name: 'password',
      label: editingUser ? 'New Password (leave blank to keep current)' : 'Password',
      type: 'password',
      required: !editingUser,
      placeholder: 'Enter password',
      validation: editingUser ? null : {
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
      }
    },
    {
      type: 'group',
      name: 'personal_info',
      columns: 'two',
      fields: [
        {
          name: 'first_name',
          label: 'First Name',
          type: 'text',
          required: true,
          placeholder: 'Enter first name'
        },
        {
          name: 'last_name',
          label: 'Last Name',
          type: 'text',
          required: true,
          placeholder: 'Enter last name'
        }
      ]
    },
    {
      type: 'group',
      name: 'contact_info',
      columns: 'two',
      fields: [
        {
          name: 'phone',
          label: 'Phone',
          type: 'tel',
          placeholder: 'Enter phone number'
        },
        {
          name: 'date_of_birth',
          label: 'Date of Birth',
          type: 'date'
        }
      ]
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      rows: 3,
      placeholder: 'Enter full address'
    },
    {
      name: 'license_number',
      label: 'License Number',
      type: 'text',
      placeholder: 'Enter driver license number'
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'customer', label: 'Customer' },
        { value: 'admin', label: 'Administrator' }
      ],
      defaultValue: 'customer'
    }
  ];

  // Bulk action buttons
  const bulkActions = [
    {
      action: 'promote_to_admin',
      label: 'Promote to Admin',
      icon: 'fas fa-user-shield',
      variant: 'btn-primary'
    },
    {
      action: 'demote_to_customer',
      label: 'Demote to Customer',
      icon: 'fas fa-user',
      variant: 'btn-secondary'
    },
    {
      action: 'delete_users',
      label: 'Delete Users',
      icon: 'fas fa-trash',
      variant: 'btn-danger'
    }
  ];

  return (
    <div className="users-management">
      <DataTable
        title="Users Management"
        data={users}
        columns={columns}
        loading={loading}
        error={error}
        onAdd={() => setShowAddModal(true)}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onBulkAction={handleBulkAction}
        searchable={true}
        filterable={true}
        sortable={true}
        selectable={true}
        actionButtons={bulkActions}
        pagination={pagination}
        onPageChange={handlePageChange}
        refreshAction={() => fetchUsers(currentPage)}
      />

      {/* Add Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
        title="Add New User"
        fields={getFormFields()}
        loading={submitting}
        submitLabel="Create User"
        size="large"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        onSubmit={handleUpdateUser}
        title="Edit User"
        fields={getFormFields()}
        initialData={editingUser || {}}
        loading={submitting}
        submitLabel="Update User"
        size="large"
      />
    </div>
  );
};

export default Users;