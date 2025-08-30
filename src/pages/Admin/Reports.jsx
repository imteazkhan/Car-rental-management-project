import React, { useState, useEffect } from 'react';
import './Reports.css';
import { Line } from 'react-chartjs-2';
import API_URL from '../../config';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [utilizationData, setUtilizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');

        const [statsRes, revenueRes, utilizationRes] = await Promise.all([
          fetch(`${API_URL}/admin.php?action=stats`, { headers: { 'Authorization': token } }),
          fetch(`${API_URL}/admin.php?action=revenue-chart`, { headers: { 'Authorization': token } }),
          fetch(`${API_URL}/admin.php?action=car-utilization`, { headers: { 'Authorization': token } })
        ]);

        const statsData = await statsRes.json();
        const revenueData = await revenueRes.json();
        const utilizationData = await utilizationRes.json();

        if (statsData.success) setStats(statsData.data);
        if (revenueData.success) setRevenueData(revenueData.data);
        if (utilizationData.success) setUtilizationData(utilizationData.data);

      } catch (err) {
        setError('Failed to fetch reports data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const revenueChartData = {
    labels: revenueData?.map(d => `Month ${d.month}`),
    datasets: [
      {
        label: 'Monthly Revenue',
        data: revenueData?.map(d => d.revenue),
        fill: false,
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  if (loading) return <div>Loading reports...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="reports-page">
      <h2>Admin Reports</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Users</h4>
          <p>{stats?.users?.total}</p>
        </div>
        <div className="stat-card">
          <h4>Total Cars</h4>
          <p>{stats?.cars?.total}</p>
        </div>
        <div className="stat-card">
          <h4>Total Bookings</h4>
          <p>{stats?.bookings?.total}</p>
        </div>
        <div className="stat-card">
          <h4>Total Revenue</h4>
          <p>${stats?.revenue?.total_revenue}</p>
        </div>
      </div>

      <div className="chart-container">
        <h3>Monthly Revenue</h3>
        {revenueData && <Line data={revenueChartData} />}
      </div>

      <div className="utilization-container">
        <h3>Car Utilization</h3>
        <table className="utilization-table">
          <thead>
            <tr>
              <th>Car</th>
              <th>Total Bookings</th>
              <th>Days Rented</th>
              <th>Average Rating</th>
            </tr>
          </thead>
          <tbody>
            {utilizationData?.map(car => (
              <tr key={car.id}>
                <td>{car.make} {car.model} ({car.year})</td>
                <td>{car.total_bookings}</td>
                <td>{car.total_days_rented}</td>
                <td>{parseFloat(car.avg_rating).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;