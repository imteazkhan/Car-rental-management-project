import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { featuredCars } from '../data/carsData'
import './Homepage.css'

function Homepage() {
  const [email, setEmail] = useState('')



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
        <div class="hero-content-container" data-aos="fade-right">
          <h2>Find Your Car</h2>
          <p>Discover amazing vehicles at unbeatable prices. Book now and drive away with confidence.</p>
          <button onClick={() => navigate('/cars')} class="cta-button">Browse Cars</button>
        </div>
        <div class="hero-image-container" data-aos="fade-left">
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
          <h2 data-aos="fade-up">Featured Cars</h2>
          <div class="cars-grid">
            {featuredCars.map((car, index) => (
              <div
                key={car.id}
                class="car-card"
                onClick={() => navigate('/cars')}
                style={{ cursor: 'pointer' }}
                data-aos="zoom-in"
                data-aos-delay={index * 200}
              >
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section class="testimonials">
        <div class="container">
          <h2 data-aos="fade-up">What Our Customers Say</h2>
          <div class="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.id} class="testimonial-card" data-aos="fade-up" data-aos-delay={index * 150}>
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
        <div class="container" data-aos="fade-up">
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