import car_image1 from '../assets/car_image1.png'
import car_image2 from '../assets/car_image2.png'
import car_image3 from '../assets/car_image3.png'
import car_image4 from '../assets/car_image4.png'

export const allCars = [
  {
    id: 1,
    name: 'Toyota Camry 2023',
    type: 'sedan',
    price: 45,
    transmission: 'automatic',
    image: car_image2,
    features: ['Automatic', 'AC', '5 Seats', 'Bluetooth', 'GPS'],
    rating: 4.8,
    description: 'This Toyota Camry 2023 is perfect for your next adventure. Well-maintained, clean, and equipped with all the essentials for a comfortable ride. Ideal for city driving and long trips alike.',
    fuel: 'Gasoline',
    seats: '5 People'
  },
  {
    id: 2,
    name: 'Honda Civic 2023',
    type: 'sedan',
    price: 40,
    transmission: 'manual',
    image: car_image3,
    features: ['Manual', 'AC', '5 Seats', 'GPS', 'USB'],
    rating: 4.6,
    description: 'This Honda Civic 2023 is perfect for your next adventure. Well-maintained, clean, and equipped with all the essentials for a comfortable ride. Ideal for city driving and long trips alike.',
    fuel: 'Gasoline',
    seats: '5 People'
  },
  {
    id: 3,
    name: 'BMW X5 2023',
    type: 'suv',
    price: 85,
    transmission: 'automatic',
    image: car_image4,
    features: ['Automatic', 'Leather', '7 Seats', 'Premium', 'Sunroof'],
    rating: 4.9,
    description: 'This BMW X5 2023 is perfect for your next adventure. Well-maintained, clean, and equipped with all the essentials for a comfortable ride. Ideal for city driving and long trips alike.',
    fuel: 'Gasoline',
    seats: '7 People'
  },
  {
    id: 4,
    name: 'Ford Mustang 2023',
    type: 'sports',
    price: 75,
    transmission: 'manual',
    image: car_image1,
    features: ['Sports', '2 Seats', 'Premium', 'Convertible'],
    rating: 4.7,
    description: 'This Ford Mustang 2023 is perfect for your next adventure. Well-maintained, clean, and equipped with all the essentials for a comfortable ride. Ideal for city driving and long trips alike.',
    fuel: 'Gasoline',
    seats: '2 People'
  },
  {
    id: 5,
    name: 'Nissan Altima 2023',
    type: 'sedan',
    price: 38,
    transmission: 'automatic',
    image: car_image1,
    features: ['AC', '5 Seats', 'Bluetooth', 'Backup Camera'],
    rating: 4.5,
    description: 'This Nissan Altima 2023 is perfect for your next adventure. Well-maintained, clean, and equipped with all the essentials for a comfortable ride. Ideal for city driving and long trips alike.',
    fuel: 'Gasoline',
    seats: '5 People'
  },
  {
    id: 6,
    name: 'Jeep Wrangler 2023',
    type: 'suv',
    price: 65,
    transmission: 'manual',
    image: car_image2,
    features: ['4WD', '5 Seats', 'Off-road', 'Removable Top'],
    rating: 4.4,
    description: 'This Jeep Wrangler 2023 is perfect for your next adventure. Well-maintained, clean, and equipped with all the essentials for a comfortable ride. Ideal for city driving and long trips alike.',
    fuel: 'Gasoline',
    seats: '5 People'
  }
]

export const featuredCars = allCars.slice(0, 3)