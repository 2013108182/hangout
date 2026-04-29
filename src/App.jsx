import React, { useState, useEffect } from 'react';
import { Calendar, Users, ChevronLeft, ChevronRight, Copy, Check, CheckCircle2, Settings, Smile, AlertCircle, Sparkles, Lock, Clock, X } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState('create'); 
  const [title, setTitle] = useState('');
  
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [deadline, setDeadline] = useState(''); // 투표 마감 기한 (YYYY-MM-DDTHH:mm)

  // 💡 새롭게 추가된 날짜 선택 모드 및 다중 선택 상태
  const [dateMode, setDateMode] = useState('range'); // 'range' | 'specific'
  const [specificDates, setSpecificDates] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState(null); // 'select' | 'deselect'

  const [rules, setRules] = useState({
    allowedDays: [], 
    singleDayOnly: false,
    anonymous: false,
    hideResults: false
  });
  
  const [viewingDate, setViewingDate] = useState(new Date());
  const [votes, setVotes] = useState([]); 
  const [voterName, setVoterName] = useState('');
  const [voterEmoji, setVoterEmoji] = useState('😎');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [voterSelections, setVoterSelections] = useState([]);
  const [copied, setCopied] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [errors, setErrors] = useState({ title: false, dates: false, name: false, selections: false });

  const [toast, setToast] = useState({ visible: false, message: '' });

  const emojis = ['😎', '🥳', '👽', '🤖', '👻', '😻', '🐶', '🦊', '🐻', '🐼', '🐰', '🐯', '🐸', '🦄', '🐙', '🦖'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const formatDate = (dateObj) => {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  };

  const formatDateTimeUI = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}/${day} ${h}:${min}`;
  };

  const todayStr = formatDate(new Date());
  const isExpired = deadline ? new Date() >= new Date(deadline) : false;
  const shouldHideResults = rules.hideResults && !hasVoted && !isExpired;

  const year = viewingDate.getFullYear();
  const month = viewingDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(year, month, i));

  const handlePrevMonth = () => setViewingDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewingDate(new Date(year, month + 1, 1));

  const toggleAllowedDay = (dayIndex) => {
    setRules(prev => {
      const isSelected = prev.allowedDays.includes(dayIndex);
      return {
        ...prev,
        allowedDays: isSelected 
          ? prev.allowedDays.filter(d => d !== dayIndex)
          : [...prev.allowedDays, dayIndex].sort()
      };
    });
  };

  // 💡 특정 날짜 선택 / 드래그 관련 핸들러
  const handleMouseDown = (dateObj) => {
    if (!dateObj || dateMode !== 'specific') return;
    const dateStr = formatDate(dateObj);
    if (dateStr < todayStr) return;
    
    setIsDragging(true);
    const isSelected = specificDates.includes(dateStr);
    const action = isSelected ? 'deselect' : 'select';
    setDragAction(action);
    
    setSpecificDates(prev => {
      if(action === 'select' && !prev.includes(dateStr)) return [...prev, dateStr].sort();
      if(action === 'deselect' && prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
      return prev;
    });
  };

  const handleMouseEnter = (dateObj) => {
    if (!isDragging || dateMode !== 'specific' || !dateObj) return;
    const dateStr = formatDate(dateObj);
    if (dateStr < todayStr) return;
    
    setSpecificDates(prev => {
      if(dragAction === 'select' && !prev.includes(dateStr)) return [...prev, dateStr].sort();
      if(dragAction === 'deselect' && prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
      return prev;
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || dateMode !== 'specific') return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const button = target?.closest('button');
    if (button && button.dataset.date) {
      const dateStr = button.dataset.date;
      if (dateStr >= todayStr) {
        setSpecificDates(prev => {
          if(dragAction === 'select' && !prev.includes(dateStr)) return [...prev, dateStr].sort();
          if(dragAction === 'deselect' && prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
          return prev;
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const handleHostDateClick = (dateObj) => {
    if (errors.dates) setErrors(prev => ({ ...prev, dates: false }));
    if (!dateObj) return;
    const dateStr = formatDate(dateObj);
    if (dateStr < todayStr) return; 

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
    } else {
      if (dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate(null);
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const handleMemberDateClick = (dateObj) => {
    if (errors.selections) setErrors(prev => ({ ...prev, selections: false }));
    if (!dateObj) return;
    const dateStr = formatDate(dateObj);

    // 💡 날짜 선택 모드에 따른 허용 여부 판별
    const isVoteInRange = dateMode === 'range' 
      ? (dateStr >= startDate && dateStr <= endDate)
      : specificDates.includes(dateStr);

    if (!isVoteInRange) return;
    if (rules.allowedDays.length > 0 && !rules.allowedDays.includes(dateObj.getDay())) return;

    if (rules.singleDayOnly) {
      setVoterSelections(voterSelections.includes(dateStr) ? [] : [dateStr]);
    } else {
      if (voterSelections.includes(dateStr)) {
        setVoterSelections(voterSelections.filter(d => d !== dateStr));
      } else {
        setVoterSelections([...voterSelections, dateStr]);
      }
    }
  };

  // 마감 기한 프리셋 헬퍼 함수
  const handlePresetDeadline = (daysToAdd, setEndOfDay = false) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    if (setEndOfDay) {
      d.setHours(23, 59, 0, 0);
    }
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDeadline(formatted);
  };

  const handleCreateLink = () => {
    let hasError = false;
    const newErrors = { ...errors };

    if (!title.trim()) {
      showToast('모임 이름을 입력해주세요.');
      newErrors.title = true;
      hasError = true;
    } else newErrors.title = false;

    // 💡 모드에 따른 유효성 검사
    if (dateMode === 'range' && (!startDate || !endDate)) {
      if (!hasError) showToast('약속 후보 날짜 범위를 선택해주세요.');
      newErrors.dates = true;
      hasError = true;
    } else if (dateMode === 'specific' && specificDates.length === 0) {
      if (!hasError) showToast('후보 날짜를 1개 이상 선택해주세요.');
      newErrors.dates = true;
      hasError = true;
    } else newErrors.dates = false;

    setErrors(newErrors);
    if (hasError) return;

    if (deadline && new Date(deadline) <= new Date()) {
      return showToast('마감 기한은 현재 시간 이후로 설정해주세요.');
    }
    
    if (rules.allowedDays.length > 0) {
      let hasValidDay = false;
      if (dateMode === 'range') {
        let curr = parseDate(startDate);
        const end = parseDate(endDate);
        while (curr <= end) {
          if (rules.allowedDays.includes(curr.getDay())) {
            hasValidDay = true;
            break;
          }
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        hasValidDay = specificDates.some(date => {
          const d = parseDate(date);
          return rules.allowedDays.includes(d.getDay());
        });
      }
      if (!hasValidDay) return showToast('설정 기간 내 허용된 요일이 없습니다.');
    }

    setStep('link');
    setViewingDate(parseDate(dateMode === 'range' ? startDate : specificDates[0]));
  };

  const handleCopyLink = () => {
    const el = document.createElement('textarea');
    el.value = "https://meetup.app/m/dummy-link-123";
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitVote = () => {
    if (isExpired) return showToast('투표가 마감되었습니다.');

    let hasError = false;
    const newErrors = { ...errors };

    if (!voterName.trim()) {
      showToast('이름을 입력해주세요.');
      newErrors.name = true;
      hasError = true;
    } else newErrors.name = false;

    if (voterSelections.length === 0) {
      if (!hasError) showToast('가능한 날짜를 1개 이상 선택하세요.');
      newErrors.selections = true;
      hasError = true;
    } else newErrors.selections = false;

    setErrors(newErrors);
    if (hasError) return;

    const existingIndex = votes.findIndex(v => v.name === voterName.trim());
    const newVoteData = { name: voterName.trim(), emoji: voterEmoji, available: voterSelections };
    
    if (existingIndex >= 0) {
      const newVotes = [...votes];
      newVotes[existingIndex] = newVoteData;
      setVotes(newVotes);
    } else {
      setVotes([...votes, newVoteData]);
    }

    setVoterName('');
    setVoterSelections([]);
    setVoterEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
    setHasVoted(true); 
  };

  const getResults = () => {
    const results = {};
    
    // 💡 모드에 따른 결과 초기화
    if (dateMode === 'range' && startDate && endDate) {
      let curr = parseDate(startDate);
      const end = parseDate(endDate);
      while(curr <= end) {
        if (rules.allowedDays.length === 0 || rules.allowedDays.includes(curr.getDay())) {
          results[formatDate(curr)] = [];
        }
        curr.setDate(curr.getDate() + 1);
      }
    } else if (dateMode === 'specific') {
      specificDates.forEach(date => {
        const d = parseDate(date);
        if (rules.allowedDays.length === 0 || rules.allowedDays.includes(d.getDay())) {
          results[date] = [];
        }
      });
    }
    
    votes.forEach(vote => {
      vote.available.forEach(date => {
        if (results[date]) results[date].push({ name: vote.name, emoji: vote.emoji });
      });
    });

    return results;
  };

  const results = getResults();
  const maxVotes = Math.max(...Object.values(results).map(arr => arr.length), 0);

  return (
    <div className="w-full h-[100dvh] overflow-y-auto bg-gray-50 text-gray-900 font-sans selection:bg-gray-900 selection:text-white relative">
      
      {/* 토스트 메시지 */}
      <div className={`fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl font-medium text-[11px] sm:text-xs flex items-center gap-1.5 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          {toast.message}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-2 sm:p-4 pb-8 sm:pb-12">
        
        {/* 헤더 */}
        {step !== 'vote' && (
          <div className="text-center mb-4 sm:mb-6 mt-2">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight mb-0.5">우리 언제 만나?</h1>
            <p className="text-[10px] sm:text-xs text-gray-500">가장 빠르고 깔끔한 약속 잡기</p>
          </div>
        )}

        {/* --- STEP 1: 방장 모임 생성 --- */}
        {step === 'create' && (
          <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 max-w-xl mx-auto">
            <div className="space-y-4 sm:space-y-6">
              {/* 모임 이름 */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1.5">모임 이름</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: false }));
                  }}
                  placeholder="예) 강남역 저녁 모임 🍻" 
                  className={`w-full px-3 py-2 sm:py-2.5 bg-gray-50 rounded-lg text-xs sm:text-sm font-medium outline-none transition-all border ${
                    errors.title ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-100 focus:border-gray-900 focus:bg-white'
                  }`}
                />
              </div>

              {/* 약속 후보 날짜 범위 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] sm:text-xs font-bold text-gray-700">약속 후보 날짜</label>
                  <div className="flex bg-gray-100 p-0.5 rounded-md">
                    <button onClick={() => setDateMode('range')} className={`px-2 py-1 rounded text-[9px] sm:text-[10px] font-bold transition-all ${dateMode === 'range' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>시작~종료</button>
                    <button onClick={() => setDateMode('specific')} className={`px-2 py-1 rounded text-[9px] sm:text-[10px] font-bold transition-all ${dateMode === 'specific' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>특정 날짜 지정</button>
                  </div>
                </div>
                
                <div className={`bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 transition-all border ${
                  errors.dates ? 'border-red-300' : 'border-transparent'
                }`}>
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-md transition-all text-gray-600"><ChevronLeft className="w-4 h-4"/></button>
                    <div className="font-bold text-xs sm:text-sm text-gray-900">{year}년 {month + 1}월</div>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-md transition-all text-gray-600"><ChevronRight className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-1 text-center mb-1">
                    {dayNames.map((day, i) => (
                      <div key={day} className={`text-[9px] sm:text-[10px] font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-0.5 text-center relative mt-1 select-none" onTouchMove={handleTouchMove}>
                    {calendarDays.map((dateObj, i) => {
                      if (!dateObj) return <div key={`empty-${i}`} className="py-0.5"></div>;
                      
                      const dateStr = formatDate(dateObj);
                      const isPast = dateStr < todayStr;
                      const isStart = dateMode === 'range' && dateStr === startDate;
                      const isEnd = dateMode === 'range' && dateStr === endDate;
                      const isBetween = dateMode === 'range' && startDate && endDate && dateStr > startDate && dateStr < endDate;
                      const isSpecificSelected = dateMode === 'specific' && specificDates.includes(dateStr);

                      return (
                        <div key={dateStr} className="relative py-0.5">
                          {isBetween && <div className="absolute inset-y-0.5 inset-x-0 bg-gray-200 pointer-events-none"></div>}
                          {isStart && endDate && <div className="absolute inset-y-0.5 right-0 w-1/2 bg-gray-200 pointer-events-none"></div>}
                          {isEnd && startDate && <div className="absolute inset-y-0.5 left-0 w-1/2 bg-gray-200 pointer-events-none"></div>}
                          
                          <button
                            data-date={dateStr}
                            disabled={isPast}
                            onMouseDown={() => handleMouseDown(dateObj)}
                            onMouseEnter={() => handleMouseEnter(dateObj)}
                            onTouchStart={() => handleMouseDown(dateObj)}
                            onClick={() => dateMode === 'range' && handleHostDateClick(dateObj)}
                            className={`relative z-10 w-6 h-6 sm:w-8 sm:h-8 mx-auto flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                              isPast ? 'text-gray-300 cursor-not-allowed' :
                              isStart || isEnd || isSpecificSelected ? 'bg-gray-900 text-white shadow-sm scale-105' : 
                              isBetween ? 'text-gray-900' :
                              'hover:bg-gray-200 text-gray-700 bg-transparent'
                            }`}
                          >
                            {dateObj.getDate()}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 투표 마감 기한 (UX 개선) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] sm:text-xs font-bold text-gray-700">투표 마감 (선택)</label>
                  {deadline && (
                    <button 
                      onClick={() => setDeadline('')}
                      className="text-[9px] sm:text-[10px] text-gray-400 hover:text-red-500 font-bold transition-colors flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> 초기화
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button 
                    onClick={() => handlePresetDeadline(0, true)}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[10px] sm:text-[11px] font-bold transition-colors"
                  >
                    오늘 자정
                  </button>
                  <button 
                    onClick={() => handlePresetDeadline(1, true)}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[10px] sm:text-[11px] font-bold transition-colors"
                  >
                    내일 자정
                  </button>
                  <button 
                    onClick={() => handlePresetDeadline(3, false)}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[10px] sm:text-[11px] font-bold transition-colors"
                  >
                    3일 뒤
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  </div>
                  <input 
                    type="datetime-local" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-gray-50 rounded-lg text-[11px] sm:text-xs font-bold outline-none transition-all border border-gray-100 focus:border-gray-900 focus:bg-white text-gray-800"
                  />
                </div>
              </div>

              {/* 투표 규칙 옵션 */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 border border-gray-100">
                <h3 className="text-[11px] sm:text-xs font-bold text-gray-900 flex items-center gap-1 mb-2.5">
                  <Settings className="w-3 h-3 text-gray-500" /> 세부 규칙
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="rule1"
                      checked={rules.allowedDays.length > 0}
                      onChange={() => setRules(prev => ({...prev, allowedDays: prev.allowedDays.length > 0 ? [] : [1,2,3,4,5]}))}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="rule1" className="text-[11px] sm:text-xs font-bold text-gray-700 cursor-pointer">특정 요일만 허용</label>
                  </div>
                  {rules.allowedDays.length > 0 && (
                    <div className="flex gap-1 pl-5">
                      {dayNames.map((day, idx) => (
                        <button
                          key={day}
                          onClick={() => toggleAllowedDay(idx)}
                          className={`w-6 h-6 rounded-md text-[9px] font-bold transition-all ${
                            rules.allowedDays.includes(idx) ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" id="rule2" checked={rules.singleDayOnly} onChange={(e) => setRules({...rules, singleDayOnly: e.target.checked})} className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"/>
                      <label htmlFor="rule2" className="text-[10px] sm:text-[11px] font-bold text-gray-700 cursor-pointer">1인 1일 선택</label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" id="rule3" checked={rules.anonymous} onChange={(e) => setRules({...rules, anonymous: e.target.checked})} className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"/>
                      <label htmlFor="rule3" className="text-[10px] sm:text-[11px] font-bold text-gray-700 cursor-pointer">익명 투표</label>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <input type="checkbox" id="rule4" checked={rules.hideResults} onChange={(e) => setRules({...rules, hideResults: e.target.checked})} className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"/>
                      <label htmlFor="rule4" className="text-[10px] sm:text-[11px] font-bold text-gray-700 cursor-pointer">투표 전 결과 블라인드</label>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCreateLink}
                className="w-full py-2.5 sm:py-3.5 rounded-lg font-bold text-xs sm:text-sm text-white bg-gray-900 hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> 투표 방 만들기
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: 링크 공유 --- */}
        {step === 'link' && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 max-w-sm mx-auto text-center mt-10">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold mb-1">투표 준비 완료!</h2>
            <p className="text-[11px] text-gray-500 mb-4">링크를 복사해서 공유하세요.</p>
            
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 pl-2.5 rounded-lg border border-gray-200 mb-4">
              <input readOnly value="https://meetup.app/m/dummy-link-123" className="bg-transparent flex-1 outline-none text-gray-700 text-[11px] font-medium truncate" />
              <button onClick={handleCopyLink} className="bg-white border border-gray-200 px-2.5 py-1.5 rounded-md text-[10px] font-bold shadow-sm">
                {copied ? '복사됨' : '복사'}
              </button>
            </div>

            <button onClick={() => setStep('vote')} className="w-full py-2.5 rounded-lg font-bold text-xs text-white bg-gray-900">
              투표 화면 가기
            </button>
          </div>
        )}

        {/* --- STEP 3: 멤버 투표 화면 --- */}
        {step === 'vote' && (
          <div className="grid md:grid-cols-12 gap-2 sm:gap-4">
            
            {/* 왼쪽: 입력 폼 */}
            <div className="md:col-span-7 space-y-2">
              
              {/* 배너 */}
              <div className="bg-white p-2.5 sm:p-3 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                  <h2 className="text-sm font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">{title}</h2>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded w-max">
                    {dateMode === 'range' ? `${startDate} ~ ${endDate}` : `${specificDates.length}개 날짜 중 선택`}
                  </span>
                </div>
                <div className="flex flex-wrap justify-end gap-1 shrink-0">
                  {deadline && <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-1 py-0.5 rounded border border-orange-100 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5"/> {formatDateTimeUI(deadline)} 마감</span>}
                  {rules.singleDayOnly && <span className="text-[9px] font-bold bg-red-50 text-red-600 px-1 py-0.5 rounded border border-red-100">1인1일</span>}
                  {rules.anonymous && <span className="text-[9px] font-bold bg-gray-50 text-gray-600 px-1 py-0.5 rounded border border-gray-200">익명</span>}
                  {rules.hideResults && <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1 py-0.5 rounded border border-blue-100">블라인드</span>}
                </div>
              </div>

              {isExpired ? (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center min-h-[200px] sm:min-h-[250px]">
                  <Clock className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm font-bold text-gray-700">투표가 마감되었습니다.</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">설정된 기한이 지나 더 이상 참여할 수 없습니다.</p>
                </div>
              ) : (
                <>
                  {/* 1. 프로필 */}
                  <div className="bg-white p-2.5 sm:p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
                    <div className="bg-gray-100 text-gray-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                    <div className="relative shrink-0">
                      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-50 border border-gray-200 rounded-lg text-lg flex items-center justify-center">
                        {voterEmoji}
                      </button>
                      {showEmojiPicker && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)}></div>
                          <div className="absolute top-10 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 w-[200px] sm:w-[240px] grid grid-cols-6 gap-1">
                            {emojis.map(e => <button key={e} onClick={() => { setVoterEmoji(e); setShowEmojiPicker(false); }} className="w-7 h-7 text-base hover:bg-gray-50 rounded-md">{e}</button>)}
                          </div>
                        </>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={voterName}
                      onChange={(e) => { setVoterName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: false })); }}
                      placeholder="이름 입력" 
                      className={`flex-1 px-3 py-1.5 sm:py-2 bg-gray-50 rounded-lg text-xs sm:text-sm font-bold outline-none border ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-gray-900 focus:bg-white'}`}
                    />
                  </div>

                  {/* 2. 달력 */}
                  <div className={`bg-white p-2.5 sm:p-3 rounded-xl shadow-sm border ${errors.selections ? 'border-red-300' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="bg-gray-100 text-gray-500 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                        <span className="text-[11px] sm:text-xs font-bold text-gray-900">날짜 선택</span>
                      </div>
                      <div className="flex gap-0.5 bg-gray-50 rounded-md p-0.5 border border-gray-100">
                         <button onClick={handlePrevMonth} className="p-1"><ChevronLeft className="w-3 h-3 text-gray-700"/></button>
                         <div className="font-bold text-gray-900 px-1 flex items-center text-[10px] sm:text-[11px]">{month + 1}월</div>
                         <button onClick={handleNextMonth} className="p-1"><ChevronRight className="w-3 h-3 text-gray-700"/></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {dayNames.map((day, i) => <div key={day} className={`text-[9px] font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</div>)}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                      {calendarDays.map((dateObj, i) => {
                        if (!dateObj) return <div key={`empty-${i}`} className="h-8 sm:h-10"></div>;
                        
                        const dateStr = formatDate(dateObj);
                        const isVoteInRange = dateMode === 'range' 
                          ? (dateStr >= startDate && dateStr <= endDate)
                          : specificDates.includes(dateStr);
                        const isDayAllowed = rules.allowedDays.length === 0 || rules.allowedDays.includes(dateObj.getDay());
                        const isSelectable = isVoteInRange && isDayAllowed;
                        const isVotedByMe = voterSelections.includes(dateStr);
                        const voteCount = results[dateStr] ? results[dateStr].length : 0;
                        
                        return (
                          <button
                            key={dateStr}
                            disabled={!isSelectable}
                            onClick={() => handleMemberDateClick(dateObj)}
                            className={`h-8 sm:h-10 flex flex-col items-center justify-center rounded-lg transition-all border ${
                              !isSelectable ? 'opacity-30 cursor-not-allowed bg-gray-50 border-transparent' :
                              isVotedByMe ? 'bg-gray-900 text-white shadow-sm border-gray-900' : 
                              'bg-white hover:border-gray-900 text-gray-900 border-gray-200'
                            }`}
                          >
                            <span className="text-[11px] sm:text-xs font-bold">{dateObj.getDate()}</span>
                            <div className="h-2.5 flex items-center">
                              {voteCount > 0 && isSelectable && !rules.hideResults && (
                                <span className={`text-[7px] font-bold px-1 py-px rounded ${isVotedByMe ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}`}>{voteCount}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={handleSubmitVote} className="w-full mt-2 sm:mt-3 py-2 rounded-lg font-bold text-xs sm:text-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors">이 날짜로 제출</button>
                  </div>
                </>
              )}
            </div>

            {/* 오른쪽: 결과 요약 */}
            <div className="md:col-span-5 self-start">
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">결과 현황</h3>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-bold">총 {votes.length}명 참여</span>
                </div>
                
                {shouldHideResults ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Lock className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                    <p className="text-[10px] text-gray-500 font-bold">투표 완료 시 공개</p>
                  </div>
                ) : votes.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold">아직 투표 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[160px] sm:max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {Object.entries(results)
                      .filter(([_, arr]) => arr.length > 0)
                      .sort((a, b) => b[1].length - a[1].length) 
                      .map(([date, availablePeople], idx) => {
                        const count = availablePeople.length;
                        const isBest = count === maxVotes && count > 0;
                        
                        return (
                          <div key={date} className={`relative p-2 sm:p-2.5 rounded-lg border ${isBest ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-[11px] sm:text-xs ${isBest ? 'text-gray-900' : 'text-gray-700'}`}>{date}</span>
                                {isBest && <span className="text-[8px] font-bold text-gray-900 bg-gray-200 px-1 py-0.5 rounded">Best</span>}
                              </div>
                              <span className="text-gray-900 text-[10px] sm:text-[11px] font-bold">{count}명</span>
                            </div>
                            
                            <div className="w-full bg-gray-100 rounded-full h-1 mb-1.5 overflow-hidden">
                              <div className={`h-1 rounded-full transition-all ${isBest ? 'bg-gray-900' : 'bg-gray-300'}`} style={{ width: `${(count / votes.length) * 100}%` }}></div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {availablePeople.map((person, pIdx) => (
                                rules.anonymous ? (
                                  <span key={pIdx} className="text-[8px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">익명</span>
                                ) : (
                                  <div key={pIdx} className="group/tooltip relative">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-[10px] sm:text-xs cursor-help">{person.emoji}</div>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
