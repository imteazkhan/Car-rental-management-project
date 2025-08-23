import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  Car, 
  Star, 
  Users, 
  Fuel, 
  Settings,
  Calendar,
  DollarSign,
  Eye,
  Heart
} from 'lucide-react';
import API_URL from '../../config';

const CarBrowsing = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriceRange, setFilterPriceRange] = useState('');
  const [filterFuelType, setFilterFuelType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    start_date: '',
    end_date: '',
    pickup_location: '',
    dropoff_location: '',
    notes: '',
    payment_method: 'credit_card'
  });

  const fetchCars = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        status: 'available',
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterFuelType && { fuel_type: filterFuelType })
      });

      if (filterPriceRange) {
        const [min, max] = filterPriceRange.split('-');
        if (min) params.append('min_price', min);
        if (max) params.append('max_price', max);
      }

      const response = await fetch(`${API_URL}/cars.php?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCars(data.data.cars);
        setTotalPages(data.data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterCategory, filterPriceRange, filterFuelType]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/cars.php?action=categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCars();
    fetchCategories();
  }, [fetchCars, fetchCategories]);

  const handleBooking = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!user.id || !token) {
      alert('You must be logged in to book a car.');
      navigate('/login');
      return;
    }

    // Calculate total amount
    const startDate = new Date(bookingData.start_date);
    const endDate = new Date(bookingData.end_date);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalAmount = days * selectedCar.daily_rate;

    try {
      const response = await axios.post(`${API_URL}/bookings.php`, {
        car_id: selectedCar.id,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        pickup_location: bookingData.pickup_location,
        dropoff_location: bookingData.dropoff_location,
        notes: bookingData.notes,
        payment_method: bookingData.payment_method,
        total_amount: totalAmount
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        alert('Booking created successfully!');
        setShowBookingModal(false);
        setBookingData({
          start_date: '',
          end_date: '',
          pickup_location: '',
          dropoff_location: '',
          notes: '',
          payment_method: 'credit_card'
        });
        
        // Redirect to MyBookings page to show the new booking
        navigate('/my-bookings', {
          state: {
            newBooking: {
              id: response.data.data.booking_id,
              car_name: `${selectedCar.make} ${selectedCar.model}`,
              car_image: selectedCar.image_url,
              start_date: bookingData.start_date,
              end_date: bookingData.end_date,
              total_amount: totalAmount,
              total_days: days,
              price_per_day: selectedCar.daily_rate,
              status: 'pending',
              booking_date: new Date().toISOString(),
              pickup_location: bookingData.pickup_location,
              dropoff_location: bookingData.dropoff_location,
              notes: bookingData.notes
            }
          }
        });
      } else {
        alert(response.data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('An error occurred while creating the booking. Please try again.');
      }
    }
  };

  const BookingModal = () => {
    if (!showBookingModal || !selectedCar) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Book This Car</h2>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <img
                src={selectedCar.image_url || '/placeholder-car.jpg'}
                alt={`${selectedCar.make} ${selectedCar.model}`}
                className="w-16 h-16 object-cover rounded-md mr-4"
              />
              <div>
                <h3 className="font-semibold">{selectedCar.make} {selectedCar.model}</h3>
                <p className="text-sm text-gray-600">${selectedCar.daily_rate}/day</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleBooking} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={bookingData.start_date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={bookingData.end_date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <input
                type="text"
                value={bookingData.pickup_location}
                onChange={(e) => setBookingData(prev => ({ ...prev, pickup_location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter pickup location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
              <input
                type="text"
                value={bookingData.dropoff_location}
                onChange={(e) => setBookingData(prev => ({ ...prev, dropoff_location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter dropoff location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows="3"
                value={bookingData.notes}
                onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requirements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={bookingData.payment_method}
                onChange={(e) => setBookingData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="cash">Cash on Pickup</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            {bookingData.payment_method !== 'cash' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      {bookingData.payment_method === 'credit_card' && 'You will be redirected to secure payment gateway to complete your booking.'}
                      {bookingData.payment_method === 'debit_card' && 'You will be redirected to secure payment gateway to complete your booking.'}
                      {bookingData.payment_method === 'paypal' && 'You will be redirected to PayPal to complete your payment.'}
                      {bookingData.payment_method === 'bank_transfer' && 'Bank transfer details will be provided after booking confirmation.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Price Summary */}
            {bookingData.start_date && bookingData.end_date && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Price Summary</h4>
                {(() => {
                  const startDate = new Date(bookingData.start_date);
                  const endDate = new Date(bookingData.end_date);
                  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                  const totalAmount = days * selectedCar.daily_rate;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>${selectedCar.daily_rate}/day × {days} day{days > 1 ? 's' : ''}</span>
                        <span>${totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Service fee</span>
                        <span>$0</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>${totalAmount}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Book & Pay
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Browse Cars</h2>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <select
              value={filterPriceRange}
              onChange={(e) => setFilterPriceRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Prices</option>
              <option value="0-50">$0 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-200">$100 - $200</option>
              <option value="200-">$200+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
            <select
              value={filterFuelType}
              onChange={(e) => setFilterFuelType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Fuel Types</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('');
              setFilterPriceRange('');
              setFilterFuelType('');
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Cars Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-md mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cars.map((car) => (
            <div key={car.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <img
                  src={car.image_url || '/placeholder-car.jpg'}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                    <Heart className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                {car.avg_rating > 0 && (
                  <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded-md shadow-md flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                    <span className="text-xs font-medium">{car.avg_rating}</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {car.make} {car.model}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{car.year} • {car.category_name}</p>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{car.seats} seats</span>
                  </div>
                  <div className="flex items-center">
                    <Fuel className="h-4 w-4 mr-1" />
                    <span>{car.fuel_type}</span>
                  </div>
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 mr-1" />
                    <span>{car.transmission}</span>
                  </div>
                </div>

                {car.features && car.features.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {car.features.slice(0, 2).map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                      {car.features.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{car.features.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      ${parseFloat(car.daily_rate).toFixed(0)}
                    </span>
                    <span className="text-sm text-gray-600">/day</span>
                  </div>
                  <button
                    onClick={() => {
                      const user = localStorage.getItem('user');
                      if (user) {
                        setSelectedCar(car);
                        setShowBookingModal(true);
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && cars.length === 0 && (
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-2 border rounded-md text-sm ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal />
    </div>
  );
};

export default CarBrowsing;
