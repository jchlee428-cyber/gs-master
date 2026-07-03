import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HistoryItem } from '../App';
import { Trash2, Users, FileText, Activity, Search, RefreshCw, BarChart2 } from 'lucide-react';

interface AdminDashboardProps {
  onViewItem: (item: HistoryItem) => void;
}

export default function AdminDashboard({ onViewItem }: AdminDashboardProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'sermons'));
      const querySnapshot = await getDocs(q);
      const data: HistoryItem[] = [];
      querySnapshot.forEach((doc) => {
        const item = doc.data() as Omit<HistoryItem, 'id'>;
        data.push({ id: doc.id, ...item });
      });
      data.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteHistory = async (id: string) => {
    if (!window.confirm('정말로 이 기록을 삭제하시겠습니까?')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'sermons', id));
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete history", err);
      alert('오류가 발생했습니다.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-100';
    if (score >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-rose-600 bg-rose-100';
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const uniqueUsers = new Set(history.map(item => item.userId).filter(Boolean)).size;
  const avgScore = history.length > 0 
    ? Math.round(history.reduce((acc, item) => acc + (item.result?.macArthurIndex || 0), 0) / history.length) 
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold font-serif text-stone-900 mb-2">관리자 대시보드</h2>
          <p className="text-stone-500">전체 설교 분석 기록 및 통계를 관리합니다.</p>
        </div>
        <button 
          onClick={fetchHistory}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors shadow-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-stone-500 text-sm font-medium mb-1">총 분석 기록</p>
            <p className="text-3xl font-bold text-stone-900">{history.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-stone-500 text-sm font-medium mb-1">참여 사용자</p>
            <p className="text-3xl font-bold text-stone-900">{uniqueUsers}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-stone-500 text-sm font-medium mb-1">평균 맥아더 지수</p>
            <p className="text-3xl font-bold text-stone-900">{avgScore}점</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2">
            <BarChart2 size={18} className="text-stone-500" />
            상세 분석 기록
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="제목 또는 사용자 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {Array.from(new Set(history.flatMap(item => item.tags || []))).length > 0 && (
          <div className="px-4 py-3 border-b border-stone-100 flex flex-wrap gap-2 bg-white">
            <span className="text-xs font-medium text-stone-500 mt-1">태그 필터:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${!selectedTag ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              전체
            </button>
            {Array.from(new Set(history.flatMap(item => item.tags || []))).sort().map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${tag === selectedTag ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider border-b border-stone-200">
                <th className="px-6 py-4 font-medium">일시</th>
                <th className="px-6 py-4 font-medium">사용자</th>
                <th className="px-6 py-4 font-medium">설교 제목</th>
                <th className="px-6 py-4 font-medium text-center">점수</th>
                <th className="px-6 py-4 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-stone-50 transition-colors cursor-pointer"
                    onClick={() => onViewItem(item)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600 truncate max-w-[150px]">
                      {item.userId || '알 수 없음'}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-800 font-medium max-w-[300px]">
                      <div className="truncate mb-1">{item.title}</div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(item.result?.macArthurIndex || 0)}`}>
                        {item.result?.macArthurIndex || 0}점
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHistory(item.id);
                        }}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
