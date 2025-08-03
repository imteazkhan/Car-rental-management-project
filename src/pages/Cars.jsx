import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cars.css'

import car_image1 from '../assets/car_image1.png'
import car_image2 from '../assets/car_image2.png'
import car_image3 from '../assets/car_image3.png'
import car_image4 from '../assets/car_image4.png'
// import car_image1 from '../assets/car_image1.png'
// import car_image2 from '../assets/car_image2.png'

function Cars() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    priceRange: 'all',
    carType: 'all',
    transmission: 'all',
    sortBy: 'price-low'
  })

  const allCars = [
    {
      id: 1,
      name: 'Toyota Camry 2023',
      type: 'sedan',
      price: 45,
      transmission: 'automatic',
      image: car_image1,
      features: ['AC', '5 Seats', 'Bluetooth', 'GPS'],
      rating: 4.8
    },
    {
      id: 2,
      name: 'Honda Civic 2023',
      type: 'sedan',
      price: 40,
      transmission: 'manual',
      image: car_image2,
      features: ['AC', '5 Seats', 'GPS', 'USB'],
      rating: 4.6
    },
    {
      id: 3,
      name: 'BMW X5 2023',
      type: 'suv',
      price: 85,
      transmission: 'automatic',
      image: car_image3,
      features: ['Leather', '7 Seats', 'Premium', 'Sunroof'],
      rating: 4.9
    },
    {
      id: 4,
      name: 'Ford Mustang 2023',
      type: 'sports',
      price: 75,
      transmission: 'manual',
      image: car_image4,
      features: ['Sports', '2 Seats', 'Premium', 'Convertible'],
      rating: 4.7
    },
    {
      id: 5,
      name: 'Nissan Altima 2023',
      type: 'sedan',
      price: 38,
      transmission: 'automatic',
      image: car_image1,
      features: ['AC', '5 Seats', 'Bluetooth', 'Backup Camera'],
      rating: 4.5
    },
    {
      id: 6,
      name: 'Jeep Wrangler 2023',
      type: 'suv',
      price: 65,
      transmission: 'manual',
      image: car_image2,
      features: ['4WD', '5 Seats', 'Off-road', 'Removable Top'],
      rating: 4.4
    }
  ]

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const filteredCars = allCars.filter(car => {
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number)
      if (max && (car.price < min || car.price > max)) return false
      if (!max && car.price < min) return false
    }
    if (filters.carType !== 'all' && car.type !== filters.carType) return false
    if (filters.transmission !== 'all' && car.transmission !== filters.transmission) return false
    return true
  })

  const sortedCars = [...filteredCars].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low': return a.price - b.price
      case 'price-high': return b.price - a.price
      case 'rating': return b.rating - a.rating
      case 'name': return a.name.localeCompare(b.name)
      default: return 0
    }
  })

  const handleBooking = (carId) => {
    navigate(`/cars/${carId}`);
  }

  return (
    <div className="cars-page">
      <div className="container">
        <h1>Available Cars</h1>
        
        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label>Price Range:</label>
            <select 
              value={filters.priceRange} 
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            >
              <option value="all">All Prices</option>
              <option value="0-50">$0 - $50</option>
              <option value="50-75">$50 - $75</option>
              <option value="75-100">$75 - $100</option>
              <option value="100">$100+</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Car Type:</label>
            <select 
              value={filters.carType} 
              onChange={(e) => handleFilterChange('carType', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="sports">Sports</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Transmission:</label>
            <select 
              value={filters.transmission} 
              onChange={(e) => handleFilterChange('transmission', e.target.value)}
            >
              <option value="all">All</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By:</label>
            <select 
              value={filters.sortBy} 
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Rating</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>Showing {sortedCars.length} of {allCars.length} cars</p>
        </div>

        {/* Cars Grid */}
        <div className="cars-grid">
          {sortedCars.map(car => (
            <div key={car.id} className="car-card" onClick={() => handleBooking(car.id)}>
              <img src={car.image} alt={car.name} />
              <div className="car-info">
                <h3>{car.name}</h3>
                <div className="car-meta">
                  <span className="car-type">{car.type.toUpperCase()}</span>
                  <span className="rating">★ {car.rating}</span>
                </div>
                <p className="price">${car.price}/day</p>
                <div className="features">
                  {car.features.map((feature, index) => (
                    <span key={index} className="feature">{feature}</span>
                  ))}
                </div>
                <div className="transmission">
                  <span>{car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1)}</span>
                </div>
                <button 
                  className="book-btn"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {sortedCars.length === 0 && (
          <div className="no-results">
            <p>No cars match your current filters. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cars