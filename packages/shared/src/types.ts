export type Category = 'culture' | 'heritage' | 'nature' | 'music_events' | 'other';

export interface Place {
  id: string;
  name: string;
  description: string;
  category: Category;
  lat: number;
  lng: number;
  geofenceRadiusM: number;
  basePoints: number;
  uniqueVisitors: number;
  photoUrl?: string;
  photoCredit?: string;
}

export interface VisitSummary {
  placeId: string;
  verifiedAt: string;
  points: number;
}
