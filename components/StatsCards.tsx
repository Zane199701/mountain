import React, { useMemo } from 'react';
import { HikingRecord } from '../types';
import { Map, Mountain, Footprints, Flame } from 'lucide-react';

interface StatsCardsProps {
  records: HikingRecord[];
  onCardClick: (type: 'trips' | 'distance' | 'elevation' | 'calories') => void;
}

const StatsCards: React.FC<StatsCardsProps> = ({ records, onCardClick }) => {
  const stats = useMemo(() => {
    return records.reduce(
      (acc, curr) => ({
        totalTrips: acc.totalTrips + 1,
        totalDistance: acc.totalDistance + curr.distanceKm,
        totalElevation: acc.totalElevation + curr.elevationGainM,
        totalDuration: acc.totalDuration + curr.durationHours,
        totalCalories: acc.totalCalories + (curr.calories || 0),
      }),
      { totalTrips: 0, totalDistance: 0, totalElevation: 0, totalDuration: 0, totalCalories: 0 }
    );
  }, [records]);

  const cards = [
    {
      id: 'trips',
      label: '总行程数',
      value: stats.totalTrips,
      unit: '次',
      icon: Map,
      color: 'bg-blue-500',
      action: 'trips' as const
    },
    {
      id: 'distance',
      label: '总距离',
      value: stats.totalDistance.toFixed(1),
      unit: 'km',
      icon: Footprints,
      color: 'bg-emerald-500',
      action: 'distance' as const
    },
    {
      id: 'elevation',
      label: '累计爬升',
      value: stats.totalElevation.toLocaleString(),
      unit: 'm',
      icon: Mountain,
      color: 'bg-indigo-500',
      action: 'elevation' as const
    },
    {
      id: 'calories',
      label: '总能耗',
      value: stats.totalCalories.toLocaleString(),
      unit: 'kcal',
      icon: Flame,
      color: 'bg-orange-500',
      action: 'calories' as const
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div 
            key={card.id} 
            onClick={() => onCardClick(card.action)}
            className="bg-white/50 backdrop-blur-xl rounded-xl shadow-sm p-6 border border-white/40 flex items-center space-x-4 transition-all hover:shadow-lg hover:bg-white/80 hover:scale-[1.02] cursor-pointer group"
        >
          <div className={`${card.color} p-3 rounded-lg text-white shadow-md group-hover:scale-110 transition-transform`}>
            <card.icon size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">{card.label}</p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              {card.value}
              <span className="text-sm text-slate-400 ml-1 font-normal">{card.unit}</span>
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;