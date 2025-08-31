import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import './Cars.css'

function Cars() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    carType: 'all',
    transmission: 'all',
    sortBy: 'price-low'
  });

  // Fetch cars and categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch cars
        const carsResponse = await fetch(`${API_URL}/cars.php`);
        const carsData = await carsResponse.json();
        
        console.log('Cars API response:', carsData);
        
        if (carsResponse.ok && carsData.success) {
          setCars(carsData.data.cars || []);
        } else {
          setError(carsData.message || 'Failed to load cars');
        }
        
        // Fetch categories (no auth needed for public access)
        const categoriesResponse = await fetch(`${API_URL}/cars.php?action=categories`);
        const categoriesData = await categoriesResponse.json();
        
        if (categoriesResponse.ok && categoriesData.success) {
          setCategories(categoriesData.data || []);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load cars. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const filteredCars = cars.filter(car => {
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number)
      const carPrice = parseFloat(car.daily_rate || car.price || 0);
      if (max && (carPrice < min || carPrice > max)) return false
      if (!max && carPrice < min) return false
    }
    
    // Use category_name from the API response
    const carType = car.category_name || car.category || car.type || '';
    if (filters.carType !== 'all' && carType.toLowerCase() !== filters.carType) return false
    
    const transmission = car.transmission || '';
    if (filters.transmission !== 'all' && transmission.toLowerCase() !== filters.transmission) return false
    
    return true
  })

  const sortedCars = [...filteredCars].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low': {
        const priceA = parseFloat(a.daily_rate || a.price || 0);
        const priceB = parseFloat(b.daily_rate || b.price || 0);
        return priceA - priceB;
      }
      case 'price-high': {
        const priceA = parseFloat(a.daily_rate || a.price || 0);
        const priceB = parseFloat(b.daily_rate || b.price || 0);
        return priceB - priceA;
      }
      case 'rating': {
        const ratingA = parseFloat(a.rating || 0);
        const ratingB = parseFloat(b.rating || 0);
        return ratingB - ratingA;
      }
      case 'name': {
        const nameA = `${a.make || ''} ${a.model || ''}` || a.name || '';
        const nameB = `${b.make || ''} ${b.model || ''}` || b.name || '';
        return nameA.localeCompare(nameB);
      }
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
              {categories.map(category => (
                <option key={category.id} value={category.name.toLowerCase()}>
                  {category.name}
                </option>
              ))}
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

        {/* Loading State */}
        {loading && (
          <div className="loading-state" data-aos="fade-up">
            <p>Loading cars...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state" data-aos="fade-up">
            <p>{error}</p>
          </div>
        )}

        {/* Results Count */}
        {!loading && !error && (
          <div className="results-info" data-aos="fade-right">
            <p>Showing {sortedCars.length} of {cars.length} cars</p>
          </div>
        )}

        {/* Cars Grid */}
        {!loading && !error && (
          <div className="cars-grid">
            {sortedCars.map((car, index) => {
              const carName = `${car.make || ''} ${car.model || ''}`.trim() || car.name || 'Unknown Car';
              const carPrice = parseFloat(car.daily_rate || car.price || 0);
              const carImage = car.image_url || '/default-car-image.jpg';
              const carType = car.category_name || car.category || car.type || 'Unknown';
              const carRating = parseFloat(car.rating || 4.0);
              const carFeatures = car.features ? (typeof car.features === 'string' ? car.features.split(',') : car.features) : [];
              
              return (
                <div 
                  key={car.id} 
                  className="car-card" 
                  onClick={() => handleBooking(car.id)} 
                  data-aos="flip-left" 
                  data-aos-delay={index * 100}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={carImage} alt={carName} onError={(e) => {
                    e.target.src = '/default-car-image.jpg';
                  }} />
                  <div className="car-info">
                    <h3>{carName}</h3>
                    <div className="car-meta">
                      <span className="car-type">{carType.toUpperCase()}</span>
                      <span className="rating">★ {carRating.toFixed(1)}</span>
                    </div>
                    <p className="price">${carPrice}/day</p>
                    {carFeatures.length > 0 && (
                      <div className="features">
                        {carFeatures.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="feature">{feature.trim()}</span>
                        ))}
                      </div>
                    )}
                    {car.transmission && (
                      <div className="transmission">
                        <span>{car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1)}</span>
                      </div>
                    )}
                    <div className="view-details">
                      <span>Click to view details</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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