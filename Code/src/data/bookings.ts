import { Provider } from "./providers";

export interface Booking {
  id: string;
  provider: Provider;
  date: string;
  location: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED';
  price: string;
}

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    provider: {
      id: 'p1',
      name: 'Ali AC Services',
      distance: '2.1 km',
      rating: 4.9,
      price: '$45/hr',
      availability: 'Available Today',
      specialization: 'HVAC Specialist',
      image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=200&auto=format&fit=crop',
      recommended: true,
      reason: 'Closest available with highest reliability'
    },
    date: 'Today, 4:00 PM',
    location: 'G-13/1, Islamabad',
    status: 'CONFIRMED',
    price: '$45'
  }
];
