import React, { useState, useRef } from 'react';
import { HikingRecord } from '../types';
import { parseHikingLogs } from '../services/geminiService';
import { Sparkles, Upload, Plus, AlertCircle, Loader2 } from 'lucide-react';

interface DataEntryProps {
  onAddRecords: (records: HikingRecord[]) => void;
  onSuccess: () => void;
}

enum Tab {
  AI_IMPORT = 'AI_IMPORT',
  MANUAL = 'MANUAL'
}

const DataEntry: React.FC<DataEntryProps> = ({ onAddRecords, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.AI_IMPORT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI Import State
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState<Partial<HikingRecord>>({
    date: new Date().toISOString().split('T')[0],
    difficultyScore: 1.5,
    sceneryScore: 1.5,
    durationHours: 0
  });

  // Helpers for time input
  const [timeHours, setTimeHours] = useState(0);
  const [timeMinutes, setTimeMinutes] = useState(0);

  const handleAIProcess = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const records = await parseHikingLogs(inputText);
      onAddRecords(records);
      setInputText('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理文本失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setInputText(text); 
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.date || !manualForm.name || !manualForm.distanceKm) {
        setError("请填写必要字段（日期、名称、距离）");
        return;
    }

    const totalDuration = Number(timeHours) + (Number(timeMinutes) / 60);

    const newRecord: HikingRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: manualForm.date,
        name: manualForm.name,
        distanceKm: Number(manualForm.distanceKm),
        elevationGainM: Number(manualForm.elevationGainM || 0),
        durationHours: Number(totalDuration.toFixed(2)),
        calories: Number(manualForm.calories || 0),
        startPoint: manualForm.startPoint || '未知',
        endPoint: manualForm.endPoint || '未知',
        difficultyScore: Number(manualForm.difficultyScore),
        sceneryScore: Number(manualForm.sceneryScore),
        notes: manualForm.notes || ''
    };

    onAddRecords([newRecord]);
    setManualForm({
        date: new Date().toISOString().split('T')[0],
        name: '',
        distanceKm: 0,
        elevationGainM: 0,
        difficultyScore: 1.5,
        sceneryScore: 1.5,
        calories: 0,
        startPoint: '',
        endPoint: '',
        notes: ''
    });
    setTimeHours(0);
    setTimeMinutes(0);
    onSuccess();
  };

  return (
    <div className="">
      <div className="flex border-b border-slate-100 mb-6">
        <button
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
            activeTab === Tab.AI_IMPORT 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
          onClick={() => setActiveTab(Tab.AI_IMPORT)}
        >
          <Sparkles size={16} />
          <span>AI 智能导入</span>
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${
            activeTab === Tab.MANUAL 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
          onClick={() => setActiveTab(Tab.MANUAL)}
        >
          <Plus size={16} />
          <span>手动录入</span>
        </button>
      </div>

      <div className="">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}

        {activeTab === Tab.AI_IMPORT && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                粘贴您的徒步日志
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-40 p-3 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-sm font-mono resize-none transition-all"
                placeholder="例如：2024年3月20日，武功山反穿。从龙山村到金顶，全程22公里，爬升1800米，耗时9小时，消耗2100大卡。风景绝美，难度系数2.5。"
              ></textarea>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center space-x-2">
                 <input 
                    type="file" 
                    accept=".txt" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-slate-600 hover:text-indigo-600 text-sm flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-slate-50 transition border border-dashed border-slate-300 hover:border-indigo-300"
                 >
                    <Upload size={16} />
                    <span>上传 .txt 文件</span>
                 </button>
              </div>

              <button
                onClick={handleAIProcess}
                disabled={isLoading || !inputText.trim()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition shadow-md hover:shadow-lg transform active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>处理中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>开始识别</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 border border-slate-100 mt-4">
                <h4 className="font-bold text-slate-700 mb-2 flex items-center"><Sparkles size={12} className="mr-1"/> AI 识别能力</h4>
                <p>Gemini 将自动提取：日期、路线名、距离、爬升、耗时、热量、起终点以及难度/风景评分。</p>
            </div>
          </div>
        )}

        {activeTab === Tab.MANUAL && (
          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">日期</label>
                <input 
                    type="date" 
                    required
                    value={manualForm.date}
                    onChange={e => setManualForm({...manualForm, date: e.target.value})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">名称</label>
                <input 
                    type="text" 
                    required
                    placeholder="路线名称"
                    value={manualForm.name}
                    onChange={e => setManualForm({...manualForm, name: e.target.value})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">起点</label>
                <input 
                    type="text" 
                    placeholder="开始地点"
                    value={manualForm.startPoint}
                    onChange={e => setManualForm({...manualForm, startPoint: e.target.value})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">终点</label>
                <input 
                    type="text" 
                    placeholder="结束地点"
                    value={manualForm.endPoint}
                    onChange={e => setManualForm({...manualForm, endPoint: e.target.value})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">距离 (km)</label>
                <input 
                    type="number" 
                    step="0.1"
                    required
                    value={manualForm.distanceKm}
                    onChange={e => setManualForm({...manualForm, distanceKm: parseFloat(e.target.value)})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">爬升 (m)</label>
                <input 
                    type="number" 
                    value={manualForm.elevationGainM}
                    onChange={e => setManualForm({...manualForm, elevationGainM: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                />
            </div>
            
            <div className="flex space-x-2">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">耗时 (小时)</label>
                    <input 
                        type="number" 
                        min="0"
                        value={timeHours}
                        onChange={e => setTimeHours(parseInt(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">分钟</label>
                    <input 
                        type="number" 
                        min="0"
                        max="59"
                        value={timeMinutes}
                        onChange={e => setTimeMinutes(parseInt(e.target.value) || 0)}
                        className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">耗能 (kcal)</label>
                <input 
                    type="number" 
                    value={manualForm.calories}
                    onChange={e => setManualForm({...manualForm, calories: parseInt(e.target.value)})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">难度 (0-3)</label>
                <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    max="3"
                    value={manualForm.difficultyScore}
                    onChange={e => setManualForm({...manualForm, difficultyScore: parseFloat(e.target.value)})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">风景 (0-3)</label>
                <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    max="3"
                    value={manualForm.sceneryScore}
                    onChange={e => setManualForm({...manualForm, sceneryScore: parseFloat(e.target.value)})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none" 
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">备注</label>
                <textarea 
                    value={manualForm.notes}
                    onChange={e => setManualForm({...manualForm, notes: e.target.value})}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none h-20 resize-none"
                ></textarea>
            </div>
            <div className="md:col-span-2 flex justify-end pt-4 border-t border-slate-100">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform active:scale-95">
                    添加记录
                </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DataEntry;