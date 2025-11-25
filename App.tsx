import React, { useState, useEffect, useRef } from 'react';
import { HikingRecord } from './types';
import * as storage from './services/storageService';
import StatsCards from './components/StatsCards';
import Charts from './components/Charts';
import DataEntry from './components/DataEntry';
import TripList from './components/TripList';
import Modal from './components/Modal';
import { Mountain, ArrowUp } from 'lucide-react';

export type ChartViewMode = 'overview' | 'distance' | 'elevation' | 'calories';

function App() {
  const [records, setRecords] = useState<HikingRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [chartView, setChartView] = useState<ChartViewMode>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const tripListRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load data from local storage on mount
    const savedRecords = storage.loadRecords();
    if (savedRecords && savedRecords.length > 0) {
        setRecords(savedRecords);
    } else {
        // Auto load seed data if storage is empty
        const seed = storage.getSeedData();
        setRecords(seed);
        // Save immediately so it persists
        storage.saveRecords(seed);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Save data whenever it changes
    if (isLoaded) {
      storage.saveRecords(records);
    }
  }, [records, isLoaded]);

  const handleAddRecords = (newRecords: HikingRecord[]) => {
    setRecords(prev => [...prev, ...newRecords]);
  };

  const handleUpdateRecord = (updatedRecord: HikingRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleLoadSeedData = () => {
    const seed = storage.getSeedData();
    setRecords(seed);
  };

  const handleStatsClick = (type: 'trips' | 'distance' | 'elevation' | 'calories') => {
      if (type === 'trips') {
          tripListRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
          setChartView(type);
          chartsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans relative overflow-x-hidden">
      {/* Background Gradient Blobs for Glassmorphism */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-200/40 blur-[100px] mix-blend-multiply animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/40 blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-blue-200/40 blur-[100px] mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-sm relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-slate-900/90 p-2 rounded-xl shadow-lg backdrop-blur-sm">
                <Mountain className="text-white h-5 w-5" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">SummitLog</h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden sm:block">Personal Hiking Tracker</p>
            </div>
          </div>
          <div className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer hidden sm:block">
            记录每一次攀登，见证更好的自己
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Stats Row */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatsCards records={records} onCardClick={handleStatsClick} />
        </div>

        {/* Main Content: Stacked Layout */}
        <div className="space-y-8">
            
            {/* Charts Section */}
            <div ref={chartsRef} className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                <Charts 
                    records={records} 
                    activeTab={chartView} 
                    onTabChange={setChartView} 
                />
            </div>
            
            {/* Trip List Section */}
            <div ref={tripListRef} className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <TripList 
                    records={records} 
                    onDelete={handleDeleteRecord} 
                    onUpdate={handleUpdateRecord}
                    onAddClick={() => setIsAddModalOpen(true)}
                />
            </div>

            {records.length === 0 && (
              <div className="text-center py-10">
                 <button 
                    onClick={handleLoadSeedData}
                    className="text-indigo-600 hover:text-indigo-800 underline text-sm font-medium"
                 >
                    重新加载示例数据
                 </button>
              </div>
            )}
        </div>
      </main>

      {/* Add Record Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="添加新行程"
        maxWidth="max-w-2xl"
      >
        <DataEntry 
            onAddRecords={handleAddRecords} 
            onSuccess={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Footer / Back to top */}
      {records.length > 5 && (
          <div className="fixed bottom-8 right-8 z-30">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg border border-white/50 text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all"
              >
                  <ArrowUp size={20} />
              </button>
          </div>
      )}
    </div>
  );
}

export default App;