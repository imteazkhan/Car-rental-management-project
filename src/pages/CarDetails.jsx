import { useParams, useNavigate } from 'react-router-dom';
import './CarDetails.css';
import car_image1 from '../assets/car_image1.png'
import car_image2 from '../assets/car_image2.png'
import car_image3 from '../assets/car_image3.png'
import car_image4 from '../assets/car_image4.png'

function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  const car = allCars.find(c => c.id === parseInt(id));

  const handleBookNow = () => {
    const newBooking = {
      id: Date.now(),
      carName: car.name,
      carImage: car.image,
      startDate: '2025-08-10',
      endDate: '2025-08-15',
      totalDays: 5,
      pricePerDay: car.price,
      totalAmount: car.price * 5,
      status: 'confirmed',
      bookingDate: new Date().toISOString().split('T')[0]
    };

    navigate('/my-bookings', { state: { newBooking } });
  };

  if (!car) {
    return <div>Car not found</div>;
  }

  return (
    <div className="car-details-page">
      <h2>{car.name}</h2>
      <div className="car-details-layout">
        <div className="car-details-image-container">
          <img src={car.image} alt={car.name} />
        </div>
        <div className="car-details-info">
          <h3>Price: ${car.price}/day</h3>
          <h4>Features:</h4>
          <ul>
            {car.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <button className="book-now-btn" onClick={handleBookNow}>Book Now</button>
        </div>
      </div>
    </div>
  );
}

export default CarDetails;