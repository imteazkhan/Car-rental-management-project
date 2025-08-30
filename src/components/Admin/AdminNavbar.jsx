import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminNavbar.css';

const AdminNavbar = ({ isOpen, setIsOpen }) => {

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    // Cleanup function to remove the class when the component unmounts
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isOpen]);

  return (
    <>
      <div className="admin-sidebar-toggle" onClick={toggleSidebar}>
        <i className={isOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
      </div>
      <div className={isOpen ? 'admin-sidebar active' : 'admin-sidebar'}>
        <div className="admin-sidebar-header">
          <Link to="/admin/dashboard" className="admin-sidebar-logo" onClick={toggleSidebar}>
            Admin Panel
          </Link>
        </div>
        <ul className="admin-sidebar-menu">
          <li className="admin-sidebar-item">
            <Link to="/admin/dashboard" className="admin-sidebar-link" onClick={toggleSidebar}>
              <i className="fas fa-tachometer-alt"></i> Overview
            </Link>
          </li>
          <li className="admin-sidebar-item">
            <Link to="/admin/users" className="admin-sidebar-link" onClick={toggleSidebar}>
              <i className="fas fa-users"></i> Users
            </Link>
          </li>
          <li className="admin-sidebar-item">
            <Link to="/admin/cars" className="admin-sidebar-link" onClick={toggleSidebar}>
              <i className="fas fa-car"></i> Cars
            </Link>
          </li>
          <li className="admin-sidebar-item">
            <Link to="/admin/bookings" className="admin-sidebar-link" onClick={toggleSidebar}>
              <i className="fas fa-book"></i> Bookings
            </Link>
          </li>
          <li className="admin-sidebar-item">
            <Link to="/admin/reports" className="admin-sidebar-link" onClick={toggleSidebar}>
              <i className="fas fa-chart-line"></i> Reports
            </Link>
          </li>
          <li className="admin-sidebar-item">
            <Link to="/admin/settings" className="admin-sidebar-link" onClick={toggleSidebar}>
              <i className="fas fa-cog"></i> Settings
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default AdminNavbar;
