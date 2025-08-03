import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import mainCarImg from '../assets/main_car.png'

import car_image2 from '../assets/car_image2.png'
import car_image3 from '../assets/car_image3.png'
import car_image4 from '../assets/car_image4.png'

// ...existing code...
import './Homepage.css'

function Homepage() {
  const [email, setEmail] = useState('')

  const featuredCars = [
    {
      id: 1,
      name: 'Toyota Camry 2023',
      price: 45,
      image: car_image2,
      features: ['Automatic', 'AC', '5 Seats', 'Bluetooth']
    },
    {
      id: 2,
      name: 'Honda Civic 2023',
      price: 40,
      image: car_image3,
      features: ['Manual', 'AC', '5 Seats', 'GPS']
    },
    {
      id: 3,
      name: 'BMW X5 2023',
      price: 85,
      image: car_image4,
      features: ['Automatic', 'Leather', '7 Seats', 'Premium']
    }
  ]

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      rating: 5,
      comment: 'Excellent service! The car was clean and well-maintained. Highly recommend!'
    },
    {
      id: 2,
      name: 'Mike Chen',
      rating: 5,
      comment: 'Great prices and friendly staff. Made my business trip so much easier.'
    },
    {
      id: 3,
      name: 'Emily Davis',
      rating: 4,
      comment: 'Smooth booking process and reliable vehicles. Will definitely use again.'
    }
  ]

  const navigate = useNavigate()

  const handleSubscribe = (e) => {
    e.preventDefault()
    alert(`Thank you for subscribing with email: ${email}`)
    setEmail('')
  }

  return (
    <div class="homepage">
      {/* Hero Section */}
      <section class="hero">
        <div class="hero-content-container">
          <h2>Find Your Car</h2>
          <p>Discover amazing vehicles at unbeatable prices. Book now and drive away with confidence.</p>
          <button onClick={() => navigate('/cars')} class="cta-button">Browse Cars</button>
        </div>
        <div class="hero-image-container">
          {/* <img
            class="hero-image"
            src={mainCarImg}
            alt="Rental Car"
          /> */}
        </div>
      </section>

      {/* Featured Cars */}
      <section class="featured-cars">
        <div class="container">
          <h2>Featured Cars</h2>
          <div class="cars-grid">
            {featuredCars.map(car => (
              <div key={car.id} class="car-card">
                <div class="car-image-wrapper">
                  <img src={car.image} alt={car.name} class="car-image" />
                </div>
                <div class="car-info">
                  <h3>{car.name}</h3>
                  <p class="price">${car.price}/day</p>
                  <div class="features">
                    {car.features.map((feature, index) => (
                      <span key={index} class="feature">{feature}</span>
                    ))}
                  </div>
                  <button
                    class="book-btn"
                    onClick={() => navigate(`/cars/${car.id}`)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section class="testimonials">
        <div class="container">
          <h2>What Our Customers Say</h2>
          <div class="testimonials-grid">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} class="testimonial-card">
                <div class="stars">
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p>"{testimonial.comment}"</p>
                <h4>- {testimonial.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Subscription */}
      <section class="newsletter">
        <div class="container">
          <h2>Stay Updated</h2>
          <p>Subscribe to get the latest deals and offers</p>
          <form onSubmit={handleSubscribe} class="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Homepage