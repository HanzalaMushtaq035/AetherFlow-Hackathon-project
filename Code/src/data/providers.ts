export interface Provider {
  id: string;
  name: string;
  distance: string;
  rating: number;
  price: string;
  availability: string;
  specialization: string;
  image: string;
  recommended: boolean;
  reason?: string;
}

export const providers: Provider[] = [
  {
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
  {
    id: 'p2',
    name: 'Expert Cooling',
    distance: '3.5 km',
    rating: 4.7,
    price: '$40/hr',
    availability: 'Available Today',
    specialization: 'AC Repair & Gas',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=200&auto=format&fit=crop',
    recommended: false
  },
  {
    id: 'p3',
    name: 'QuickFix Plumbers',
    distance: '1.5 km',
    rating: 4.8,
    price: '$35/hr',
    availability: 'Available Now',
    specialization: 'Master Plumber',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=200&auto=format&fit=crop',
    recommended: true,
    reason: 'Top rated for emergency repairs'
  },
  {
    id: 'p4',
    name: 'Spark Systems',
    distance: '4.2 km',
    rating: 4.6,
    price: '$50/hr',
    availability: 'Tomorrow',
    specialization: 'Industrial Electrician',
    image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=200&auto=format&fit=crop',
    recommended: false
  },
  {
    id: 'p5',
    name: 'Tutor Match',
    distance: '0.5 km',
    rating: 5.0,
    price: '$25/hr',
    availability: 'Available Online',
    specialization: 'Mathematics Tutor',
    image: 'https://images.unsplash.com/photo-1544717297-fa154da09f5b?q=80&w=200&auto=format&fit=crop',
    recommended: true,
    reason: 'Matched for Calculus specialty'
  },
  {
    id: 'p6',
    name: 'Clean Slate',
    distance: '2.8 km',
    rating: 4.5,
    price: '$20/hr',
    availability: 'Available Monday',
    specialization: 'Deep Cleaning',
    image: 'https://images.unsplash.com/photo-1581578731522-7455051462c1?q=80&w=200&auto=format&fit=crop',
    recommended: false
  }
];
