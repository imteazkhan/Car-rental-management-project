import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import './CarDetails.css';

function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch car details from API
  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/cars.php?action=getById&id=${id}`);
        const data = await response.json();
        
        if (response.ok && data.success && data.data) {
          setCar(data.data);
        } else {
          // If the specific API endpoint doesn't exist, fetch all cars and find the one
          const allCarsResponse = await fetch(`${API_URL}/cars.php`);
          const allCarsData = await allCarsResponse.json();
          
          if (allCarsResponse.ok && allCarsData.success) {
            const foundCar = allCarsData.data.cars?.find(c => c.id === parseInt(id));
            if (foundCar) {
              setCar(foundCar);
            } else {
              setError('Car not found');
            }
          } else {
            setError('Failed to fetch car details');
          }
        }
      } catch (err) {
        console.error('Error fetching car details:', err);
        setError('Error loading car details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCarDetails();
    }
  }, [id]);

  // Calculate days between dates
  const calculateDays = () => {
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const diffTime = Math.abs(returnD - pickup);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setSelectedLocation(value);
    
    if (value === 'custom') {
      setShowCustomInput(true);
      setSelectedLocation('custom');
    } else {
      setShowCustomInput(false);
      setCustomLocation('');
    }
  };

  const handleCustomLocationChange = (e) => {
    setCustomLocation(e.target.value);
  };

  const handleAddCustomLocation = () => {
    if (customLocation.trim()) {
      // In a real app, you would save this to a database or local storage
      alert(`Custom location "${customLocation}" added successfully!`);
      setShowCustomInput(false);
      setSelectedLocation('');
      setCustomLocation('');
    }
  };

  const totalDays = calculateDays();
  const totalAmount = car ? (car.daily_rate || car.price) * totalDays : 0;

  const handleBookNow = async () => {
    // Check authentication using AuthContext and fallback to localStorage
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
    const currentToken = token || localStorage.getItem('token');
    
    if (!currentUser || !currentToken) {
      alert('You must be logged in to book a car.');
      navigate('/login');
      return;
    }

    if (!pickupDate || !returnDate) {
      alert('Please select both pickup and return dates.');
      return;
    }

    const finalLocation = selectedLocation === 'custom' ? customLocation : selectedLocation;
    if (!finalLocation) {
      alert('Please select or enter a pickup location.');
      return;
    }

    try {
      console.log('Sending booking request with data:', {
        car_id: car.id,
        start_date: pickupDate,
        end_date: returnDate,
        total_price: totalAmount + 40,
        payment_method: 'Credit Card'
      });
      console.log('Using token:', currentToken);
      
      const response = await axios.post(`${API_URL}/bookings.php`, {
        car_id: car.id,
        start_date: pickupDate,
        end_date: returnDate,
        total_price: totalAmount + 40, // Assuming 40 is the fixed additional charges (service fee + insurance)
        payment_method: 'Credit Card' // Example payment method
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        }
      });

      console.log('API Response:', response.data);
      
      if (response.data && response.data.success) {
        alert('Booking created successfully!');
        navigate('/my-bookings');
      } else {
        const errorMessage = response.data?.message || response.data?.error || 'Unknown error';
        console.error('Booking failed with response:', response.data);
        alert('Failed to create booking: ' + errorMessage);
      }
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.data) {
        // Server responded with error
        const errorMessage = error.response.data.message || error.response.data.error || 'Server error';
        alert('Failed to create booking: ' + errorMessage);
      } else if (error.request) {
        // Network error
        alert('Network error: Please check your connection and try again.');
      } else {
        // Other error
        alert('Error creating booking: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading car details...</div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error || 'Car not found'}</p>
          <button onClick={() => navigate('/cars')} className="back-to-cars-btn">
            Back to Cars
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="car-details-page">
      {/* Navigation Bar */}
      <nav className="car-details-nav">
        <div className="nav-container">
          <button className="back-button" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          {/* <div className="nav-links">
            <a href="/">Home</a>
            <a href="/cars">All Cars</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </div> */}
          {/* <div className="nav-actions">
            <button className="nav-icon-btn">
              <i className="fas fa-search"></i>
            </button>
            <button className="nav-icon-btn">
              <i className="fas fa-user"></i>
            </button>
          </div> */}
        </div>
      </nav>

      <div className="container">
        <div className="car-details-layout">
          {/* Left Side - Car Image and Details */}
          <div className="left-section">
            {/* Large Car Image */}
            <div className="car-image-section" data-aos="zoom-in">
              <img src={car.image_url} alt={car.name} className="main-car-image" />
            </div>

            {/* Car Information Below Image */}
            <div className="car-info-section" data-aos="fade-up" data-aos-delay="200">
              <div className="car-header">
                <h1>{car.name || `${car.make} ${car.model}`}</h1>
                <div className="car-rating">
                  <span className="stars">{'★'.repeat(Math.floor(car.rating || 4))}</span>
                  <span className="rating-number">{car.rating || 4.0}</span>
                  <span className="reviews">(124 reviews)</span>
                </div>
              </div>

              <div className="car-specs">
                <div className="spec-item">
                  <span className="spec-label">Type:</span>
                  <span className="spec-value">{(car.type || car.category_name || 'Standard').toUpperCase()}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Transmission:</span>
                  <span className="spec-value">{(car.transmission || 'Manual').charAt(0).toUpperCase() + (car.transmission || 'Manual').slice(1)}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Fuel:</span>
                  <span className="spec-value">{car.fuel_type || car.fuel || 'Petrol'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Seats:</span>
                  <span className="spec-value">{car.seats || car.seating_capacity || 5}</span>
                </div>
              </div>

              <div className="car-features">
                <h3>Features & Amenities</h3>
                <div className="features-grid">
                  {(car.features || ['Air Conditioning', 'GPS Navigation', 'Bluetooth', 'USB Charging']).map((feature, index) => (
                    <div key={index} className="feature-item" data-aos="fade-up" data-aos-delay={index * 50}>
                      <span className="feature-icon">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="car-description">
                <h3>Description</h3>
                <p>{car.description || `Experience the comfort and reliability of the ${car.name || `${car.make} ${car.model}`}. Perfect for both city driving and longer journeys.`}</p>
              </div>
            </div>
          </div>

          {/* Right Side - Booking Panel */}
          <div className="right-section">
            <div className="booking-panel" data-aos="fade-left" data-aos-delay="300">
              <div className="price-header">
                <span className="price">${car.daily_rate || car.price}</span>
                <span className="price-unit">/ day</span>
              </div>

              <div className="booking-form">
                <div className="date-inputs">
                  <div className="date-group">
                    <label>Pick-up Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="date-group">
                    <label>Return Date</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={pickupDate}
                    />
                  </div>
                </div>

                <div className="location-input">
                  <label>Pick-up Location</label>
                  <select value={selectedLocation} onChange={handleLocationChange}>
                    <option value="">Select a location</option>
                    <option value="Golshan">Gulshan</option>
                    <option value="Airport Terminal - Gate A">Airport Terminal - Gate A</option>
                    <option value="Dhaka - Shopping Center">Dhaka - Shopping Center</option>
                    <option value="custom">+ Add custom location</option>
                  </select>
                  
                  {showCustomInput && (
                    <div className="custom-location-input">
                      <input
                        type="text"
                        placeholder="Enter your custom location"
                        value={customLocation}
                        onChange={handleCustomLocationChange}
                      />
                      <button 
                        className="add-location-btn"
                        onClick={handleAddCustomLocation}
                      >
                        Add Location
                      </button>
                    </div>
                  )}
                </div>

                <div className="pricing-breakdown">
                  <div className="price-row">
                    <span>${car.daily_rate || car.price} × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                    <span>${(car.daily_rate || car.price) * totalDays}</span>
                  </div>
                  <div className="price-row">
                    <span>Service fee</span>
                    <span>$15</span>
                  </div>
                  <div className="price-row">
                    <span>Insurance</span>
                    <span>$25</span>
                  </div>
                  <hr />
                  <div className="price-row total">
                    <span>Total</span>
                    <span>${totalAmount + 40}</span>
                  </div>
                </div>

                <button className="book-now-btn" onClick={handleBookNow}>
                  Reserve Now
                </button>

                <p className="booking-note">You won't be charged yet</p>
              </div>

              <div className="additional-info">
                <div className="info-item">
                  <div>
                    <strong>Free cancellation</strong>
                    <p>Cancel up to 24 hours before pickup</p>
                  </div>
                </div>
                <div className="info-item">
                  <div>
                    <strong>Fuel policy</strong>
                    <p>Return with the same fuel level</p>
                  </div>
                </div>
                <div className="info-item">
                  <div>
                    <strong>24/7 Support</strong>
                    <p>Get help anytime during your rental</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add the CSS for the navigation bar and custom location input */}
     
    </div>
  );
}

export default CarDetails;