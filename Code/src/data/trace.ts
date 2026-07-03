import { TraceLog } from "@/store/useStore";

export const mockTraceLogs: Omit<TraceLog, 'id'>[] = [
  { timestamp: '14:20:01', agent: 'Intent Agent', message: 'Analyzing request parameters...', type: 'INFO' },
  { timestamp: '14:20:02', agent: 'Intent Agent', message: 'Service identified: AC Technician', type: 'SUCCESS' },
  { timestamp: '14:20:03', agent: 'Location Agent', message: 'Mapping G-13 service grid...', type: 'INFO' },
  { timestamp: '14:20:04', agent: 'Location Agent', message: '34 available technicians found in radius.', type: 'SUCCESS' },
  { timestamp: '14:20:05', agent: 'Provider Agent', message: 'Scraping real-time availability...', type: 'INFO' },
  { timestamp: '14:20:07', agent: 'Provider Agent', message: 'Filtered to 4 optimal candidates.', type: 'SUCCESS' },
  { timestamp: '14:20:08', agent: 'Ranking Agent', message: 'Applying multi-parameter quality metrics...', type: 'INFO' },
  { timestamp: '14:20:10', agent: 'Ranking Agent', message: 'Ali AC selected as top recommendation.', type: 'SUCCESS' },
];
