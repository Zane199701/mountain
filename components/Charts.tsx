import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { HikingRecord } from '../types';
import { ChartViewMode } from '../App';
import { eachDayOfInterval, format, endOfYear, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, BarChart2, AlignLeft, AlignJustify, ChevronDown } from 'lucide-react';

interface ChartsProps {
  records: HikingRecord[];
  activeTab: ChartViewMode;
  onTabChange: (tab: ChartViewMode) => void;
}

type AxisType = 'categorical' | 'continuous';
type MonthlyMetric = 'distance' | 'elevation' | 'calories';

const METRIC_CONFIG = {
  distanceKm: { label: '路程', unit: 'km' },
  elevationGainM: { label: '爬升', unit: 'm' },
  durationHours: { label: '耗时', unit: 'h' },
  calories: { label: '能耗', unit: 'kcal' },
  difficultyScore: { label: '难度系数', unit: '' },
  sceneryScore: { label: '风景系数', unit: '' },
};

type MetricKey = keyof typeof METRIC_CONFIG;

const Charts: React.FC<ChartsProps> = ({ records, activeTab, onTabChange }) => {
  const [axisType, setAxisType] = useState<AxisType>('categorical');
  
  // Scatter Chart Axis State
  const [xAxisKey, setXAxisKey] = useState<MetricKey>('distanceKm');
  const [yAxisKey, setYAxisKey] = useState<MetricKey>('difficultyScore');

  // Monthly Chart Metric State
  const [monthlyMetric, setMonthlyMetric] = useState<MonthlyMetric>('distance');

  // Calendar Tooltip State
  const [hoveredCalendarDay, setHoveredCalendarDay] = useState<{
    data: any;
    rect: DOMRect;
  } | null>(null);

  // Helper: Get data range for continuous axis
  const dateRange = useMemo(() => {
    if (records.length === 0) return null;
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const start = new Date(sorted[0].date);
    const end = new Date(sorted[sorted.length - 1].date);
    return { start, end };
  }, [records]);

  // 1. Monthly Data (Overview)
  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string; dateObj: Date; distance: number; elevation: number; calories: number }> = {};
    records.forEach(record => {
      const dateObj = new Date(record.date + 'T00:00:00');
      const key = format(dateObj, 'yyyy-MM');
      if (!data[key]) {
        data[key] = {
          month: format(dateObj, 'yyyy/MM'),
          dateObj: dateObj,
          distance: 0,
          elevation: 0,
          calories: 0,
        };
      }
      data[key].distance += record.distanceKm;
      data[key].elevation += record.elevationGainM;
      data[key].calories += (record.calories || 0);
    });
    return Object.values(data).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [records]);

  // 2. Per Trip Data (Day Granularity)
  const tripData = useMemo(() => {
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (axisType === 'categorical' || !dateRange) {
        return sorted.map(r => ({
            ...r,
            displayDate: r.date.slice(5),
            fullDate: r.date,
            tooltipTitle: r.name
        }));
    } else {
        const allDays = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        return allDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const found = sorted.find(r => r.date === dateStr);
            if (found) {
                return {
                    ...found,
                    displayDate: format(day, 'MM-dd'),
                    fullDate: dateStr,
                    tooltipTitle: found.name
                };
            } else {
                return {
                    id: `empty-${dateStr}`,
                    date: dateStr,
                    name: '无记录',
                    distanceKm: 0,
                    elevationGainM: 0,
                    calories: 0,
                    displayDate: format(day, 'MM-dd'),
                    fullDate: dateStr,
                    tooltipTitle: '无记录'
                } as unknown as HikingRecord;
            }
        });
    }
  }, [records, axisType, dateRange]);

  // 3. Scatter Data (Dynamic)
  const scatterData = useMemo(() => {
    return records.map(r => ({
      ...r,
      x: r[xAxisKey],
      y: r[yAxisKey],
      // For tooltip context
      name: r.name,
      tooltipDate: r.date,
    }));
  }, [records, xAxisKey, yAxisKey]);

  // 4. Calendar Heatmap Data
  const calendarData = useMemo(() => {
     const today = new Date();
     const start = new Date(today.getFullYear(), 0, 1);
     const end = endOfYear(today);
     const days = eachDayOfInterval({ start, end });

     return days.map(day => {
         const dateStr = format(day, 'yyyy-MM-dd');
         const dayRecords = records.filter(r => r.date === dateStr);
         const totalDist = dayRecords.reduce((acc, r) => acc + r.distanceKm, 0);
         const names = dayRecords.map(r => r.name).join(', ');
         
         let level = 0;
         if (totalDist > 0) level = 1;
         if (totalDist > 5) level = 2;
         if (totalDist > 10) level = 3;
         if (totalDist > 20) level = 4;

         return {
             date: day,
             dateStr,
             level,
             totalDist,
             names,
             count: dayRecords.length
         };
     });
  }, [records]);

  if (records.length === 0) {
    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm p-12 text-center text-slate-400 border border-white/20">
            <div className="mb-4 bg-slate-50/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <BarChart2 size={32} className="text-slate-300" />
            </div>
            暂无数据，请添加您的第一条行程！
        </div>
    )
  }

  const renderTabButton = (id: ChartViewMode, label: string) => (
      <button
        onClick={() => onTabChange(id)}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === id 
            ? 'bg-slate-800 text-white shadow-lg shadow-slate-200/50' 
            : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
        }`}
      >
          {label}
      </button>
  );

  const AxisSelector = ({ value, onChange, label }: { value: MetricKey, onChange: (k: MetricKey) => void, label: string }) => (
    <div className="flex items-center space-x-2 text-sm">
        <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">{label}</span>
        <div className="relative">
            <select 
                value={value}
                onChange={(e) => onChange(e.target.value as MetricKey)}
                className="appearance-none bg-slate-50/50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-white transition-colors"
            >
                {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    </div>
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40">
        {/* Controls Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-slate-100/50 gap-4">
            <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl backdrop-blur-sm">
                {renderTabButton('overview', '综合概览')}
                {renderTabButton('distance', '单次距离')}
                {renderTabButton('elevation', '单次爬升')}
                {renderTabButton('calories', '单次能耗')}
            </div>

            {/* Axis Toggle */}
            {activeTab !== 'overview' && (
                <div className="flex items-center bg-slate-50/50 rounded-lg p-1 border border-slate-200/50">
                    <button
                        onClick={() => setAxisType('categorical')}
                        className={`p-1.5 rounded-md flex items-center space-x-2 text-xs font-medium transition-colors ${
                            axisType === 'categorical' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="紧凑视图：仅显示有记录的日期"
                    >
                        <AlignJustify size={14} />
                        <span>紧凑</span>
                    </button>
                    <button
                        onClick={() => setAxisType('continuous')}
                        className={`p-1.5 rounded-md flex items-center space-x-2 text-xs font-medium transition-colors ${
                            axisType === 'continuous' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="日历视图：显示连续日期"
                    >
                        <AlignLeft size={14} />
                        <span>连续</span>
                    </button>
                </div>
            )}
        </div>

        <div className="p-6">
            {/* OVERVIEW MODE */}
            {activeTab === 'overview' && (
                <div className="space-y-10">
                    {/* Calendar Heatmap */}
                    <div className="w-full relative">
                        <div className="flex items-center mb-4 space-x-2">
                             <CalendarIcon size={16} className="text-slate-400" />
                             <h3 className="text-sm font-semibold text-slate-700">年度徒步日历 ({new Date().getFullYear()})</h3>
                        </div>
                        
                        {/* Scrollable Container */}
                        <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                            <div 
                                className="flex flex-wrap gap-1 p-2 justify-start min-w-max"
                                onMouseLeave={() => setHoveredCalendarDay(null)}
                            >
                                 <div className="grid grid-flow-col grid-rows-7 gap-1 pr-4">
                                    {calendarData.map((d) => (
                                        <div 
                                            key={d.dateStr}
                                            onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredCalendarDay({ data: d, rect });
                                            }}
                                            className={`w-3 h-3 rounded-sm transition-all hover:ring-2 ring-indigo-300 relative cursor-default
                                                ${d.level === 0 ? 'bg-slate-200/50' : ''}
                                                ${d.level === 1 ? 'bg-emerald-200' : ''}
                                                ${d.level === 2 ? 'bg-emerald-300' : ''}
                                                ${d.level === 3 ? 'bg-emerald-400' : ''}
                                                ${d.level === 4 ? 'bg-emerald-600' : ''}
                                            `}
                                        />
                                    ))}
                                 </div>
                            </div>
                        </div>

                        {/* Custom Tooltip Portal for Calendar */}
                        {hoveredCalendarDay && (
                            <div 
                                className="fixed z-[9999] bg-slate-800/95 backdrop-blur-sm text-white text-[10px] py-2 px-3 rounded-lg shadow-xl pointer-events-none transition-opacity animate-in fade-in duration-200"
                                style={{
                                    top: hoveredCalendarDay.rect.top - 45,
                                    left: hoveredCalendarDay.rect.left + hoveredCalendarDay.rect.width / 2,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                <div className="font-bold whitespace-nowrap">{hoveredCalendarDay.data.dateStr}</div>
                                <div className="text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                                    {hoveredCalendarDay.data.totalDist > 0 
                                        ? `${hoveredCalendarDay.data.totalDist.toFixed(1)}km - ${hoveredCalendarDay.data.names}`
                                        : '无记录'
                                    }
                                </div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800/95 rotate-45"></div>
                            </div>
                        )}

                        <div className="flex items-center justify-end text-xs text-slate-400 space-x-1 mt-2">
                            <span>少</span>
                            <div className="w-3 h-3 bg-slate-200/50 rounded-sm"></div>
                            <div className="w-3 h-3 bg-emerald-200 rounded-sm"></div>
                            <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
                            <div className="w-3 h-3 bg-emerald-600 rounded-sm"></div>
                            <span>多</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-100/50">
                        {/* Monthly Bar Chart */}
                        <div className="h-72 w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-semibold text-slate-700">每月累计{monthlyMetric === 'distance' ? '路程' : monthlyMetric === 'elevation' ? '爬升' : '能耗'}</h3>
                                
                                {/* Monthly Chart Metric Toggle */}
                                <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
                                    <button 
                                        onClick={() => setMonthlyMetric('distance')}
                                        className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${monthlyMetric === 'distance' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        距离
                                    </button>
                                    <button 
                                        onClick={() => setMonthlyMetric('elevation')}
                                        className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${monthlyMetric === 'elevation' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        爬升
                                    </button>
                                    <button 
                                        onClick={() => setMonthlyMetric('calories')}
                                        className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${monthlyMetric === 'calories' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        能耗
                                    </button>
                                </div>
                            </div>
                            
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.9)' }}
                                />
                                <Bar 
                                    dataKey={monthlyMetric} 
                                    name={monthlyMetric === 'distance' ? "距离 (km)" : monthlyMetric === 'elevation' ? "爬升 (m)" : "能耗 (kcal)"} 
                                    fill={monthlyMetric === 'distance' ? "#10b981" : monthlyMetric === 'elevation' ? "#6366f1" : "#f97316"} 
                                    radius={[4, 4, 0, 0]} 
                                />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Interactive Scatter Chart */}
                        <div className="h-96 w-full flex flex-col pt-2 lg:pl-4">
                            <div className="flex justify-between items-center mb-6 px-1">
                                <h3 className="text-sm font-semibold text-slate-700">数据相关性分布</h3>
                            </div>
                            
                            <div className="flex justify-center gap-4 mb-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                                <AxisSelector label="X轴" value={xAxisKey} onChange={setXAxisKey} />
                                <div className="h-6 w-px bg-slate-200"></div>
                                <AxisSelector label="Y轴" value={yAxisKey} onChange={setYAxisKey} />
                            </div>

                            <div className="flex-1 min-h-0 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis 
                                        type="number" 
                                        dataKey="x" 
                                        name={METRIC_CONFIG[xAxisKey].label} 
                                        unit={METRIC_CONFIG[xAxisKey].unit} 
                                        stroke="#94a3b8" 
                                        fontSize={11} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        type="number" 
                                        dataKey="y" 
                                        name={METRIC_CONFIG[yAxisKey].label} 
                                        unit={METRIC_CONFIG[yAxisKey].unit} 
                                        stroke="#94a3b8" 
                                        fontSize={11} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <Tooltip 
                                        cursor={{ strokeDasharray: '3 3' }} 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white/95 backdrop-blur-md p-3 shadow-xl rounded-xl border border-white/50 text-sm z-50">
                                                <p className="font-bold text-slate-800 mb-1">{data.name}</p>
                                                <p className="text-xs text-slate-500 mb-2">{data.tooltipDate}</p>
                                                <div className="text-xs space-y-1">
                                                    <p className="flex justify-between gap-4">
                                                        <span className="text-slate-500">{METRIC_CONFIG[xAxisKey].label}:</span>
                                                        <span className="font-medium text-slate-700">{data.x} {METRIC_CONFIG[xAxisKey].unit}</span>
                                                    </p>
                                                    <p className="flex justify-between gap-4">
                                                        <span className="text-slate-500">{METRIC_CONFIG[yAxisKey].label}:</span>
                                                        <span className="font-medium text-slate-700">{data.y} {METRIC_CONFIG[yAxisKey].unit}</span>
                                                    </p>
                                                </div>
                                                </div>
                                            );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="行程" data={scatterData} fill="#6366f1" fillOpacity={0.6} />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SINGLE METRIC MODES */}
            {activeTab !== 'overview' && (
                <div className="h-80 w-full">
                    <h3 className="text-sm font-semibold text-slate-500 mb-4 text-center">
                        {activeTab === 'distance' && '每次行程距离 (km)'}
                        {activeTab === 'elevation' && '每次行程爬升 (m)'}
                        {activeTab === 'calories' && '每次行程耗能 (kcal)'}
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tripData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }} barCategoryGap={axisType === 'continuous' ? 1 : '20%'}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="displayDate" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                angle={-45} 
                                textAnchor="end" 
                                interval={axisType === 'continuous' ? 6 : 0} 
                            />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip 
                                cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        if (data.distanceKm === 0) return null;
                                        return (
                                            <div className="bg-white/90 backdrop-blur-md p-3 shadow-xl rounded-xl border border-white/50 text-xs">
                                                <p className="font-bold text-slate-800">{data.name}</p>
                                                <p className="text-slate-500 mb-2">{data.fullDate}</p>
                                                {activeTab === 'distance' && <p className="text-emerald-600 font-bold bg-emerald-50/50 px-2 py-1 rounded inline-block">距离: {data.distanceKm} km</p>}
                                                {activeTab === 'elevation' && <p className="text-indigo-600 font-bold bg-indigo-50/50 px-2 py-1 rounded inline-block">爬升: {data.elevationGainM} m</p>}
                                                {activeTab === 'calories' && <p className="text-orange-600 font-bold bg-orange-50/50 px-2 py-1 rounded inline-block">耗能: {data.calories} kcal</p>}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar 
                                dataKey={
                                    activeTab === 'distance' ? 'distanceKm' : 
                                    activeTab === 'elevation' ? 'elevationGainM' : 'calories'
                                } 
                                fill={
                                    activeTab === 'distance' ? '#10b981' : 
                                    activeTab === 'elevation' ? '#6366f1' : '#f97316'
                                } 
                                radius={[4, 4, 0, 0]} 
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    </div>
  );
};

export default Charts;