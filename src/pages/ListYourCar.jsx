import { useState } from 'react'
import './ListYourCar.css'

function ListYourCar() {
  const [formData, setFormData] = useState({
    // Car Details
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    mileage: '',
    
    // Car Specifications
    transmission: 'automatic',
    fuelType: 'gasoline',
    seats: '5',
    carType: 'sedan',
    
    // Features
    features: [],
    
    // Pricing
    pricePerDay: '',
    
    // Owner Details
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    
    // Location
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Additional Info
    description: '',
    rules: '',
    
    // Images
    images: []
  })

  const availableFeatures = [
    'Air Conditioning', 'Bluetooth', 'GPS Navigation', 'Backup Camera',
    'Heated Seats', 'Sunroof', 'Leather Seats', 'USB Ports',
    'Wireless Charging', 'Premium Sound', 'Cruise Control', 'Keyless Entry'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFeatureChange = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    // In a real app, you'd upload these to a server
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files.map(file => URL.createObjectURL(file))]
    }))
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    alert('Your car has been submitted for review! We will contact you within 24 hours.')
    // Reset form
    setFormData({
      make: '', model: '', year: '', color: '', licensePlate: '', mileage: '',
      transmission: 'automatic', fuelType: 'gasoline', seats: '5', carType: 'sedan',
      features: [], pricePerDay: '', ownerName: '', ownerPhone: '', ownerEmail: '',
      address: '', city: '', state: '', zipCode: '', description: '', rules: '', images: []
    })
  }

  return (
    <div className="list-your-car">
      <div className="container">
        <h1>List Your Car</h1>
        <p className="subtitle">Share your car and earn money when you're not using it</p>
        
        <form onSubmit={handleSubmit} className="car-form">
          {/* Car Details Section */}
          <div className="form-section">
            <h2>Car Details</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Make *</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  placeholder="e.g., Toyota"
                  required
                />
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g., Camry"
                  required
                />
              </div>
              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="e.g., 2023"
                  min="2000"
                  max="2025"
                  required
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., White"
                />
              </div>
              <div className="form-group">
                <label>License Plate *</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC123"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mileage</label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  placeholder="e.g., 25000"
                />
              </div>
            </div>
          </div>

          {/* Car Specifications */}
          <div className="form-section">
            <h2>Specifications</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Transmission *</label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                  required
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fuel Type *</label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
              <div className="form-group">
                <label>Number of Seats *</label>
                <select
                  name="seats"
                  value={formData.seats}
                  onChange={handleInputChange}
                  required
                >
                  <option value="2">2 Seats</option>
                  <option value="4">4 Seats</option>
                  <option value="5">5 Seats</option>
                  <option value="7">7 Seats</option>
                  <option value="8">8+ Seats</option>
                </select>
              </div>
              <div className="form-group">
                <label>Car Type *</label>
                <select
                  name="carType"
                  value={formData.carType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="coupe">Coupe</option>
                  <option value="convertible">Convertible</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                </select>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="form-section">
            <h2>Features</h2>
            <div className="features-grid">
              {availableFeatures.map(feature => (
                <label key={feature} className="feature-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureChange(feature)}
                  />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section">
            <h2>Pricing</h2>
            <div className="form-group">
              <label>Price per Day ($) *</label>
              <input
                type="number"
                name="pricePerDay"
                value={formData.pricePerDay}
                onChange={handleInputChange}
                placeholder="e.g., 45"
                min="1"
                required
              />
              <small>We recommend pricing competitively based on similar cars in your area</small>
            </div>
          </div>

          {/* Owner Details */}
          <div className="form-section">
            <h2>Owner Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h2>Car Location</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  required
                />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  required
                />
              </div>
              <div className="form-group">
                <label>ZIP Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="12345"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-section">
            <h2>Additional Information</h2>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your car, its condition, and any special features..."
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Rental Rules</label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleInputChange}
                placeholder="Any specific rules for renters (e.g., no smoking, no pets, etc.)..."
                rows="3"
              />
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h2>Car Photos</h2>
            <div className="form-group">
              <label>Upload Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <small>Upload at least 3 high-quality photos of your car (exterior, interior, dashboard)</small>
            </div>
            
            {formData.images.length > 0 && (
              <div className="image-preview">
                {formData.images.map((image, index) => (
                  <div key={index} className="image-item">
                    <img src={image} alt={`Car ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Submit Car for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ListYourCar