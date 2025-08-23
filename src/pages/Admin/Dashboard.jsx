import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../components/Admin/NotificationProvider';
import API_URL from '../../config';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [carUtilization, setCarUtilization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showError } = useNotification();

  // Fetch dashboard statistics
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin.php?action=stats`, {
        headers: {
          'Authorization': token,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        showError(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      showError('Failed to load dashboard statistics');
    }
  }, [showError]);

  // Fetch revenue chart data
  const fetchRevenueChart = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin.php?action=revenue-chart`, {
        headers: {
          'Authorization': token,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setRevenueChart(data.data);
      }
    } catch (error) {
      console.error('Error fetching revenue chart:', error);
    }
  }, []);

  // Fetch car utilization data
  const fetchCarUtilization = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin.php?action=car-utilization`, {
        headers: {
          'Authorization': token,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setCarUtilization(data.data.slice(0, 5)); // Top 5 cars
      }
    } catch (error) {
      console.error('Error fetching car utilization:', error);
    }
  }, []);

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchRevenueChart(),
      fetchCarUtilization()
    ]);
    setLoading(false);
  }, [fetchStats, fetchRevenueChart, fetchCarUtilization]);

  // Refresh dashboard data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadDashboardData, fetchStats]);

  // Get month name from month number
  const getMonthName = (monthNum) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[monthNum - 1] || '';
  };

  // Calculate percentage for utilization bars
  const getUtilizationPercentage = (bookings, maxBookings) => {
    return maxBookings > 0 ? (bookings / maxBookings) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Failed to load dashboard data</p>
        <button onClick={handleRefresh} className="btn btn-primary">
          <i className="fas fa-refresh"></i>
          Try Again
        </button>
      </div>
    );
  }

  const maxBookings = Math.max(...carUtilization.map(car => car.total_bookings), 1);

  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening with your car rental business.</p>
        </div>
        <button 
          onClick={handleRefresh} 
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          disabled={refreshing}
        >
          <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon cars">
            <i className="fas fa-car"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.cars.total}</h3>
            <p>Total Cars</p>
            <div className="stat-breakdown">
              <span className="breakdown-item available">
                <i className="fas fa-circle"></i>
                {stats.cars.available || 0} Available
              </span>
              <span className="breakdown-item rented">
                <i className="fas fa-circle"></i>
                {stats.cars.rented || 0} Rented
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon users">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.users.total}</h3>
            <p>Total Users</p>
            <div className="stat-breakdown">
              <span className="breakdown-item customers">
                <i className="fas fa-circle"></i>
                {stats.users.customers || 0} Customers
              </span>
              <span className="breakdown-item admins">
                <i className="fas fa-circle"></i>
                {stats.users.admins || 0} Admins
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bookings">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.bookings.total}</h3>
            <p>Total Bookings</p>
            <div className="stat-breakdown">
              <span className="breakdown-item active">
                <i className="fas fa-circle"></i>
                {stats.bookings.active || 0} Active
              </span>
              <span className="breakdown-item pending">
                <i className="fas fa-circle"></i>
                {stats.bookings.pending || 0} Pending
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-content">
            <h3>${Number(stats.revenue.total_revenue || 0).toLocaleString()}</h3>
            <p>Total Revenue</p>
            <div className="stat-breakdown">
              <span className="breakdown-item month">
                <i className="fas fa-circle"></i>
                ${Number(stats.revenue.month_revenue || 0).toLocaleString()} This Month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="dashboard-content">
        {/* Revenue Chart */}
        <div className="chart-section">
          <div className="section-header">
            <h2>
              <i className="fas fa-chart-line"></i>
              Monthly Revenue
            </h2>
            <span className="chart-subtitle">Revenue trend for {new Date().getFullYear()}</span>
          </div>
          <div className="revenue-chart">
            {revenueChart.length > 0 ? (
              <div className="chart-bars">
                {revenueChart.map((month, index) => {
                  const maxRevenue = Math.max(...revenueChart.map(m => m.revenue), 1);
                  const height = (month.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={index} className="chart-bar-container">
                      <div 
                        className="chart-bar"
                        style={{ height: `${height}%` }}
                        title={`${getMonthName(month.month)}: $${Number(month.revenue).toLocaleString()}`}
                      >
                        <span className="bar-value">
                          ${Number(month.revenue).toLocaleString()}
                        </span>
                      </div>
                      <span className="bar-label">{getMonthName(month.month)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="chart-empty">
                <i className="fas fa-chart-line"></i>
                <p>No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Car Utilization */}
        <div className="utilization-section">
          <div className="section-header">
            <h2>
              <i className="fas fa-car"></i>
              Top Performing Cars
            </h2>
            <span className="chart-subtitle">Most booked vehicles</span>
          </div>
          <div className="utilization-list">
            {carUtilization.length > 0 ? (
              carUtilization.map((car, index) => (
                <div key={car.id} className="utilization-item">
                  <div className="car-info">
                    <div className="car-rank">#{index + 1}</div>
                    <div className="car-details">
                      <h4>{car.make} {car.model} {car.year}</h4>
                      <span className="license-plate">{car.license_plate}</span>
                    </div>
                  </div>
                  <div className="utilization-stats">
                    <div className="utilization-bar">
                      <div 
                        className="utilization-fill"
                        style={{ width: `${getUtilizationPercentage(car.total_bookings, maxBookings)}%` }}
                      ></div>
                    </div>
                    <div className="utilization-numbers">
                      <span className="bookings-count">{car.total_bookings} bookings</span>
                      <span className="rating">
                        <i className="fas fa-star"></i>
                        {Number(car.avg_rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="utilization-empty">
                <i className="fas fa-car"></i>
                <p>No car utilization data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="recent-section">
          <div className="section-header">
            <h2>
              <i className="fas fa-clock"></i>
              Recent Bookings
            </h2>
            <span className="chart-subtitle">Latest booking activity</span>
          </div>
          <div className="recent-bookings">
            {stats.recent_bookings && stats.recent_bookings.length > 0 ? (
              stats.recent_bookings.map((booking, index) => (
                <div key={booking.id} className="recent-booking-item">
                  <div className="booking-icon">
                    <i className="fas fa-calendar-plus"></i>
                  </div>
                  <div className="booking-details">
                    <h4>{booking.first_name} {booking.last_name}</h4>
                    <p>{booking.make} {booking.model} {booking.year}</p>
                    <span className="booking-dates">
                      {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status}
                    </span>
                    <span className="booking-amount">
                      ${Number(booking.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="recent-empty">
                <i className="fas fa-calendar"></i>
                <p>No recent bookings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
