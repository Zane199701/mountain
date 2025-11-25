export interface HikingRecord {
  id: string;
  date: string; // ISO 8601 YYYY-MM-DD
  name: string; // 名称
  distanceKm: number; // 路程
  elevationGainM: number; // 爬升
  durationHours: number; // 耗时 (Stored as decimal hours for calculation, displayed as hh:mm)
  calories: number; // 耗能 (kcal)
  startPoint: string; // 起点
  endPoint: string; // 终点
  difficultyScore: number; // 难度系数 (e.g., 1.0 - 10.0)
  sceneryScore: number; // 风景系数 (e.g., 1.0 - 5.0)
  notes: string; // 备注
}

export type SortField = 'date' | 'distanceKm' | 'elevationGainM' | 'durationHours' | 'difficultyScore' | 'sceneryScore';
export type SortOrder = 'asc' | 'desc';

export interface DashboardStats {
  totalTrips: number;
  totalDistance: number;
  totalElevation: number;
  totalDuration: number;
  totalCalories: number;
}