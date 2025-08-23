import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  // Menu items data for dynamic rendering
  const menuItems = [
    { path: "/admin/dashboard", icon: "fas fa-home", text: "Overview" },
    { path: "/admin/users", icon: "fas fa-users", text: "Users" },
    { path: "/admin/cars", icon: "fas fa-car", text: "Cars" },
    { path: "/admin/bookings", icon: "fas fa-calendar-check", text: "Bookings" },
    { path: "/admin/reports", icon: "fas fa-chart-bar", text: "Reports" },
    { path: "/admin/settings", icon: "fas fa-cog", text: "Settings" },
  ];

  // Function to get page title based on current path
  const getPageTitle = () => {
    const item = menuItems.find(item => item.path === location.pathname);
    return item ? item.text : "Admin Dashboard";
  };

  return (
    <div className={`admin-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>
            <i className="fas fa-tachometer-alt"></i>
            <span className="logo-text">Admin Panel</span>
          </h3>
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <i className={`fas ${isSidebarOpen ? "fa-chevron-left" : "fa-chevron-right"}`}></i>
          </button>
        </div>

        <div className="sidebar-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
            >
              <i className={item.icon}></i>
              <span className="menu-text">{item.text}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">AD</div>
            <div className="user-details">
              <span className="user-name">Admin User</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <div className="top-header">
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <i className="fas fa-bars"></i>
          </button>

          <h1 className="page-title">{getPageTitle()}</h1>

          <div className="header-actions">
            <div className="notification-bell">
              <i className="fas fa-bell"></i>
              <span className="notification-count">3</span>
            </div>

            <div className="user-profile">
              <div className="user-avatar-sm">AD</div>
            </div>
          </div>
        </div>

        {/* Nested Routes - This will render the child components */}
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;