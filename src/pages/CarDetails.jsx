import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { allCars } from '../data/carsData';
import './CarDetails.css';

function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pickupDate, setPickupDate] = useState('2025-08-10');
  const [returnDate, setReturnDate] = useState('2025-08-15');

  // Calculate days between dates
  const calculateDays = () => {
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const diffTime = Math.abs(returnD - pickup);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };



  const car = allCars.find(c => c.id === parseInt(id));

  const totalDays = calculateDays();
  const totalAmount = car.price * totalDays;

  const handleBookNow = () => {
    const user = localStorage.getItem('user');
    if (!user) {
      alert('You must be logged in to book a car.');
      navigate('/login');
      return;
    }

    const newBooking = {
      id: Date.now(),
      carName: car.name,
      carImage: car.image,
      startDate: pickupDate,
      endDate: returnDate,
      totalDays: totalDays,
      pricePerDay: car.price,
      totalAmount: totalAmount,
      status: 'confirmed',
      bookingDate: new Date().toISOString().split('T')[0],
      features: car.features,
      transmission: car.transmission,
      type: car.type,
      rating: car.rating
    };

    navigate('/my-bookings', { state: { newBooking } });
  };

  if (!car) {
    return <div>Car not found</div>;
  }

  return (
    <div className="car-details-page">
      <div className="container">
        <div className="car-details-layout">
          {/* Left Side - Car Image and Details */}
          <div className="left-section">
            {/* Large Car Image */}
            <div className="car-image-section" data-aos="zoom-in">
              <img src={car.image} alt={car.name} className="main-car-image" />
            </div>

            {/* Car Information Below Image */}
            <div className="car-info-section" data-aos="fade-up" data-aos-delay="200">
              <div className="car-header">
                <h1>{car.name}</h1>
                <div className="car-rating">
                  <span className="stars">{'★'.repeat(Math.floor(car.rating))}</span>
                  <span className="rating-number">{car.rating}</span>
                  <span className="reviews">(124 reviews)</span>
                </div>
              </div>

              <div className="car-specs">
                <div className="spec-item">
                  <span className="spec-label">Type:</span>
                  <span className="spec-value">{car.type.toUpperCase()}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Transmission:</span>
                  <span className="spec-value">{car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1)}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Fuel:</span>
                  <span className="spec-value">{car.fuel}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Seats:</span>
                  <span className="spec-value">{car.seats}</span>
                </div>
              </div>

              <div className="car-features">
                <h3>Features & Amenities</h3>
                <div className="features-grid">
                  {car.features.map((feature, index) => (
                    <div key={index} className="feature-item" data-aos="fade-up" data-aos-delay={index * 50}>
                      <span className="feature-icon">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="car-description">
                <h3>Description</h3>
                <p>{car.description}</p>
              </div>
            </div>
          </div>

          {/* Right Side - Booking Panel */}
          <div className="right-section">
            <div className="booking-panel" data-aos="fade-left" data-aos-delay="300">
              <div className="price-header">
                <span className="price">${car.price}</span>
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
                  <select>
                    <option>Downtown Office - 123 Main St</option>
                    <option>Airport Terminal - Gate A</option>
                    <option>Mall Location - Shopping Center</option>
                  </select>
                </div>

                <div className="pricing-breakdown">
                  <div className="price-row">
                    <span>${car.price} × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                    <span>${car.price * totalDays}</span>
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
                  {/* <span className="info-icon">🚗</span> */}
                  <div>
                    <strong>Free cancellation</strong>
                    <p>Cancel up to 24 hours before pickup</p>
                  </div>
                </div>
                <div className="info-item">
                  {/* <span className="info-icon">⛽</span> */}
                  <div>
                    <strong>Fuel policy</strong>
                    <p>Return with the same fuel level</p>
                  </div>
                </div>
                <div className="info-item">
                  {/* <span className="info-icon">📱</span> */}
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
    </div>
  );
}

export default CarDetails;