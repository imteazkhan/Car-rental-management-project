import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = () => {
  // State for form data
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Car Rental Management',
    defaultCurrency: 'USD'
  });

  const [bookingSettings, setBookingSettings] = useState({
    minRentalDuration: 1,
    maxRentalDuration: 30
  });

  const [paymentSettings, setPaymentSettings] = useState({
    stripeApiKey: '',
    paypalApiKey: ''
  });

  // State for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/settings');
        const settings = response.data;

        setGeneralSettings({
          siteName: settings.siteName || 'Car Rental Management',
          defaultCurrency: settings.defaultCurrency || 'USD'
        });

        setBookingSettings({
          minRentalDuration: parseInt(settings.minRentalDuration) || 1,
          maxRentalDuration: parseInt(settings.maxRentalDuration) || 30
        });

        setPaymentSettings({
          stripeApiKey: settings.stripeApiKey || '',
          paypalApiKey: settings.paypalApiKey || ''
        });
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle form input changes
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingSettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentSettings(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submissions
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post('/api/settings', generalSettings);
      setSuccess('General settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update general settings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const settingsToSave = {
      minRentalDuration: parseInt(bookingSettings.minRentalDuration, 10),
      maxRentalDuration: parseInt(bookingSettings.maxRentalDuration, 10),
    };

    if (isNaN(settingsToSave.minRentalDuration) || isNaN(settingsToSave.maxRentalDuration) || settingsToSave.minRentalDuration <= 0 || settingsToSave.maxRentalDuration <= 0) {
      setError('Please enter valid positive numbers for booking duration.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/settings', settingsToSave);
      setSuccess('Booking settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update booking settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post('/api/settings', paymentSettings);
      setSuccess('Payment settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payment settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <h2>Admin Settings</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      
      <div className="settings-container">
        <div className="settings-card">
          <h3>General Settings</h3>
          <form onSubmit={handleGeneralSubmit}>
            <div className="form-group">
              <label htmlFor="siteName">Site Name</label>
              <input
                type="text"
                name="siteName"
                value={generalSettings.siteName}
                onChange={handleGeneralChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="defaultCurrency">Default Currency</label>
              <input
                type="text"
                name="defaultCurrency"
                value={generalSettings.defaultCurrency}
                onChange={handleGeneralChange}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="settings-card">
          <h3>Booking Settings</h3>
          <form onSubmit={handleBookingSubmit}>
            <div className="form-group">
              <label htmlFor="minRentalDuration">Minimum Rental Duration (days)</label>
              <input
                type="number"
                name="minRentalDuration"
                value={bookingSettings.minRentalDuration}
                onChange={handleBookingChange}
                min="1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="maxRentalDuration">Maximum Rental Duration (days)</label>
              <input
                type="number"
                name="maxRentalDuration"
                value={bookingSettings.maxRentalDuration}
                onChange={handleBookingChange}
                min="1"
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="settings-card">
          <h3>Payment Gateway</h3>
          <form onSubmit={handlePaymentSubmit}>
            <div className="form-group">
              <label htmlFor="stripeApiKey">Stripe API Key</label>
              <input
                type="text"
                name="stripeApiKey"
                value={paymentSettings.stripeApiKey}
                onChange={handlePaymentChange}
                placeholder="sk_test_..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="paypalApiKey">PayPal API Key</label>
              <input
                type="text"
                name="paypalApiKey"
                value={paymentSettings.paypalApiKey}
                onChange={handlePaymentChange}
                placeholder="..."
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;