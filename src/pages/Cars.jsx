import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { allCars } from '../data/carsData';
import './Cars.css'

function Cars() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    priceRange: 'all',
    carType: 'all',
    transmission: 'all',
    sortBy: 'price-low'
  })



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
    navigate(`/cardetails/${carId}`);
  }

  return (
    <div className="cars-page">
      <div className="container">
        <h1 data-aos="fade-down">Available Cars</h1>
        
        {/* Filters */}
        <div className="filters" data-aos="fade-up" data-aos-delay="200">
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
        <div className="results-info" data-aos="fade-right">
          <p>Showing {sortedCars.length} of {allCars.length} cars</p>
        </div>

        {/* Cars Grid */}
        <div className="cars-grid">
          {sortedCars.map((car, index) => (
            <div 
              key={car.id} 
              className="car-card" 
              onClick={() => handleBooking(car.id)} 
              data-aos="flip-left" 
              data-aos-delay={index * 100}
              style={{ cursor: 'pointer' }}
            >
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
                <div className="view-details">
                  <span>Click to view details</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedCars.length === 0 && (
          <div className="no-results" data-aos="fade-up">
            <p>No cars match your current filters. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cars