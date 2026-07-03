export interface Request {
  id: string;
  text: string;
  status: 'PENDING' | 'EXTRACTED' | 'FAILED';
  service?: string;
  location?: string;
  time?: string;
  timestamp: string;
}

export const mockRequests: Request[] = [
  {
    id: 'r1',
    text: 'Mujhe plumber chahiye for tap leak',
    status: 'EXTRACTED',
    service: 'Plumber',
    location: 'G-13, Islamabad',
    time: 'ASAP',
    timestamp: '2024-05-16 14:10'
  },
  {
    id: 'r2',
    text: 'AC service tomorrow morning',
    status: 'EXTRACTED',
    service: 'AC Repair',
    location: 'F-10, Islamabad',
    time: 'Tomorrow, 10:00 AM',
    timestamp: '2024-05-16 15:30'
  }
];
