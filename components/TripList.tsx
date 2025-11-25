import React, { useState, useEffect } from 'react';
import { HikingRecord } from '../types';
import { Trash2, Calendar, MapPin, TrendingUp, Clock, AlertTriangle, Flame, Activity, Star, Edit2, X, Save, Plus, ArrowRight } from 'lucide-react';
import Modal from './Modal';

interface TripListProps {
  records: HikingRecord[];
  onDelete: (id: string) => void;
  onUpdate: (record: HikingRecord) => void;
  onAddClick: () => void;
}

const TripList: React.FC<TripListProps> = ({ records, onDelete, onUpdate, onAddClick }) => {
  const [selectedRecord, setSelectedRecord] = useState<HikingRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Edit Form State
  const [editForm, setEditForm] = useState<Partial<HikingRecord>>({});
  const [editTime, setEditTime] = useState({ hours: 0, minutes: 0 });

  // Sort by date desc
  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helpers
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };
  
  const formatFullDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr + 'T00:00:00');
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m > 0 ? `${m}m` : ''}`;
  };

  const handleRowClick = (record: HikingRecord) => {
      setSelectedRecord(record);
      setIsEditing(false);
      setShowDeleteConfirm(false);
  };

  const startEditing = () => {
      if (!selectedRecord) return;
      setIsEditing(true);
      setEditForm(JSON.parse(JSON.stringify(selectedRecord))); // Deep copy
      const h = Math.floor(selectedRecord.durationHours);
      const m = Math.round((selectedRecord.durationHours - h) * 60);
      setEditTime({ hours: h, minutes: m });
  };

  const cancelEditing = () => {
      setIsEditing(false);
      setEditForm({});
  };

  const saveEditing = () => {
      if (editForm && selectedRecord) {
          const totalHours = Number(editTime.hours) + (Number(editTime.minutes) / 60);
          const updatedRecord = {
              ...selectedRecord,
              ...editForm,
              durationHours: Number(totalHours.toFixed(2)),
              distanceKm: Number(editForm.distanceKm),
              elevationGainM: Number(editForm.elevationGainM),
              calories: Number(editForm.calories),
              difficultyScore: Number(editForm.difficultyScore),
              sceneryScore: Number(editForm.sceneryScore)
          } as HikingRecord;
          
          onUpdate(updatedRecord);
          setSelectedRecord(updatedRecord); 
          setIsEditing(false);
      }
  };

  const confirmDelete = () => {
      if (selectedRecord) {
          onDelete(selectedRecord.id);
          setSelectedRecord(null); 
          setShowDeleteConfirm(false);
      }
  };

  const renderEditField = (label: string, value: string | number | undefined, onChange: (val: string) => void, type: string = "text", widthClass="w-full", extraProps = {}) => (
    <div className="flex flex-col">
        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">{label}</label>
        <input 
            type={type}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all ${widthClass}`}
            {...extraProps}
        />
    </div>
  );

  return (
    <>
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="p-4 border-b border-white/20 flex justify-between items-center bg-white/30 backdrop-blur-md sticky top-0 z-10">
            <h3 className="font-bold text-slate-800 flex items-center">
                <Calendar className="mr-2 text-indigo-500" size={18} />
                行程历史
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200">
                    {records.length}
                </span>
            </h3>
            <button 
                onClick={onAddClick}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-transform active:scale-95 shadow-lg shadow-slate-200"
            >
                <Plus size={14} />
                <span>记一笔</span>
            </button>
        </div>

        {/* Compact List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {sortedRecords.map((record) => (
                <div 
                    key={record.id} 
                    onClick={() => handleRowClick(record)}
                    className="group bg-white/40 hover:bg-white/80 border border-transparent hover:border-indigo-100 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:shadow-md flex items-center justify-between"
                >
                    <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center justify-center bg-white/50 w-16 h-14 rounded-lg border border-white/60 shadow-sm shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">{record.date ? new Date(record.date).getFullYear() : ''}</span>
                            <span className="text-sm font-bold text-slate-700 leading-none whitespace-nowrap">{formatDate(record.date)}</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{record.name}</h4>
                            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                                <span className="flex items-center"><MapPin size={10} className="mr-0.5" />{record.startPoint} <ArrowRight size={8} className="mx-1"/> {record.endPoint}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-slate-700">{record.distanceKm} <span className="text-[10px] text-slate-400 font-normal">km</span></div>
                            <div className="text-[10px] text-slate-400">路程</div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-slate-700">{record.elevationGainM} <span className="text-[10px] text-slate-400 font-normal">m</span></div>
                            <div className="text-[10px] text-slate-400">爬升</div>
                        </div>
                         <div className="text-right w-16">
                             <div className={`text-xs font-bold px-2 py-1 rounded-md inline-block text-center w-full
                                ${record.difficultyScore >= 2.5 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}
                             `}>
                                 Lv.{record.difficultyScore}
                             </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Details Modal */}
      <Modal 
        isOpen={!!selectedRecord} 
        onClose={() => {
            setSelectedRecord(null);
            setIsEditing(false);
            setShowDeleteConfirm(false);
        }}
        title={isEditing ? "编辑行程" : "行程详情"}
      >
        {selectedRecord && (
            <div className="space-y-6">
                {!isEditing ? (
                    /* VIEW MODE */
                    <div className="animate-in fade-in duration-300">
                        {showDeleteConfirm ? (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center space-y-4">
                                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-red-600">
                                    <Trash2 size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-900">确定删除这条记录吗？</h4>
                                    <p className="text-sm text-red-700/70 mt-1">此操作无法撤销。</p>
                                </div>
                                <div className="flex justify-center space-x-3 pt-2">
                                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50">取消</button>
                                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm">确认删除</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{selectedRecord.name}</h2>
                                        <div className="flex items-center text-slate-500 text-sm mt-1 space-x-2">
                                            <Calendar size={14} />
                                            <span>{formatFullDate(selectedRecord.date)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={startEditing} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="编辑">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="删除">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-xs text-slate-400 mb-1 flex items-center"><Activity size={12} className="mr-1"/> 路程</div>
                                        <div className="font-bold text-lg text-slate-700">{selectedRecord.distanceKm}<span className="text-xs font-normal ml-1">km</span></div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-xs text-slate-400 mb-1 flex items-center"><TrendingUp size={12} className="mr-1"/> 爬升</div>
                                        <div className="font-bold text-lg text-slate-700">{selectedRecord.elevationGainM}<span className="text-xs font-normal ml-1">m</span></div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-xs text-slate-400 mb-1 flex items-center"><Clock size={12} className="mr-1"/> 耗时</div>
                                        <div className="font-bold text-lg text-slate-700">{formatDuration(selectedRecord.durationHours)}</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-xs text-slate-400 mb-1 flex items-center"><Flame size={12} className="mr-1"/> 耗能</div>
                                        <div className="font-bold text-lg text-slate-700">{selectedRecord.calories}<span className="text-xs font-normal ml-1">kcal</span></div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center space-x-2 text-sm bg-white/50 p-3 rounded-lg border border-slate-100">
                                        <MapPin size={16} className="text-indigo-500 shrink-0" />
                                        <span className="font-medium text-slate-700">{selectedRecord.startPoint || '未知起点'}</span>
                                        <ArrowRight size={14} className="text-slate-400" />
                                        <span className="font-medium text-slate-700">{selectedRecord.endPoint || '未知终点'}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-indigo-50 to-white p-3 rounded-xl border border-indigo-100/50">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-indigo-900/60 uppercase">难度系数</span>
                                                <AlertTriangle size={14} className="text-indigo-400" />
                                            </div>
                                            <div className="flex items-end">
                                                <span className="text-2xl font-bold text-indigo-600">{selectedRecord.difficultyScore}</span>
                                                <span className="text-xs text-indigo-400 mb-1.5 ml-1">/ 3</span>
                                            </div>
                                            <div className="w-full bg-indigo-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min((selectedRecord.difficultyScore / 3) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-emerald-50 to-white p-3 rounded-xl border border-emerald-100/50">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-emerald-900/60 uppercase">风景指数</span>
                                                <Star size={14} className="text-emerald-400" />
                                            </div>
                                            <div className="flex items-end">
                                                <span className="text-2xl font-bold text-emerald-600">{selectedRecord.sceneryScore}</span>
                                                <span className="text-xs text-emerald-400 mb-1.5 ml-1">/ 3</span>
                                            </div>
                                            <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min((selectedRecord.sceneryScore / 3) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedRecord.notes && (
                                        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic relative">
                                            <span className="absolute top-2 left-2 text-slate-200 text-4xl font-serif leading-none">"</span>
                                            <p className="relative z-10 pl-2">{selectedRecord.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    /* EDIT MODE */
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            {renderEditField("日期", editForm.date, (v) => setEditForm({...editForm, date: v}), "date")}
                            {renderEditField("名称", editForm.name, (v) => setEditForm({...editForm, name: v}))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {renderEditField("起点", editForm.startPoint, (v) => setEditForm({...editForm, startPoint: v}))}
                            {renderEditField("终点", editForm.endPoint, (v) => setEditForm({...editForm, endPoint: v}))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {renderEditField("路程 (km)", editForm.distanceKm, (v) => setEditForm({...editForm, distanceKm: parseFloat(v)}), "number")}
                            {renderEditField("爬升 (m)", editForm.elevationGainM, (v) => setEditForm({...editForm, elevationGainM: parseInt(v)}), "number")}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider block">耗时 (时:分)</label>
                                <div className="flex space-x-2">
                                    <input type="number" value={editTime.hours} onChange={(e) => setEditTime({...editTime, hours: parseInt(e.target.value) || 0})} className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"/>
                                    <input type="number" value={editTime.minutes} max="59" onChange={(e) => setEditTime({...editTime, minutes: parseInt(e.target.value) || 0})} className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                            </div>
                            {renderEditField("耗能 (kcal)", editForm.calories, (v) => setEditForm({...editForm, calories: parseInt(v)}), "number")}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {renderEditField("难度 (0-3)", editForm.difficultyScore, (v) => setEditForm({...editForm, difficultyScore: parseFloat(v)}), "number", "w-full", {min: 0, max: 3, step: 0.5})}
                            {renderEditField("风景 (0-3)", editForm.sceneryScore, (v) => setEditForm({...editForm, sceneryScore: parseFloat(v)}), "number", "w-full", {min: 0, max: 3, step: 0.5})}
                        </div>
                        <div>
                             <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider block">备注</label>
                             <textarea 
                                value={editForm.notes || ''} 
                                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                             ></textarea>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button onClick={cancelEditing} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium">取消</button>
                            <button onClick={saveEditing} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md flex items-center">
                                <Save size={16} className="mr-2"/> 保存修改
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </Modal>
    </>
  );
};

export default TripList;