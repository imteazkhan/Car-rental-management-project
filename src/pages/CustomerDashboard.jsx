import React, { useState, useEffect } from 'react';
import { FaCar, FaCalendarAlt, FaCreditCard, FaCommentDots, FaUser, FaSignOutAlt, FaStar } from 'react-icons/fa';
import CarBrowsing from '../components/Customer/CarBrowsing';
import MyBookings from '../components/Customer/MyBookings';
import PaymentHistory from '../components/Customer/PaymentHistory';
import Profile from '../components/Customer/Profile';
import Reviews from '../components/Customer/Reviews';

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const menuItems = [
    { id: 'browse', label: 'Browse Cars', icon: FaCar },
    { id: 'bookings', label: 'My Bookings', icon: FaCalendarAlt },
    { id: 'payments', label: 'Payment History', icon: FaCreditCard },
    { id: 'reviews', label: 'My Reviews', icon: FaStar },
    { id: 'profile', label: 'Profile', icon: FaUser },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'browse':
        return <CarBrowsing />;
      case 'bookings':
        return <MyBookings />;
      case 'payments':
        return <PaymentHistory />;
      case 'reviews':
        return <Reviews />;
      case 'profile':
        return <Profile />;
      default:
        return <CarBrowsing />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <FaCar className="w-5 h-5 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Car Rental</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.first_name} {user?.last_name}
              </span>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm mr-8">
            <nav className="mt-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-6 py-3 text-left text-sm font-medium rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
