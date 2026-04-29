import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle2, ChevronLeft, ChevronRight, Link as LinkIcon, Copy, Check, Settings, Smile, AlertCircle, Sparkles, Lock } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState('create'); 
  const [title, setTitle] = useState('');
  
  // 방장 설정 상태
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [rules, setRules] = useState({
    allowedDays: [], 
    singleDayOnly: false,
    anonymous: false,
    hideResults: false // 새 규칙: 투표 전 결과 블라인드
  });
  
  // 달력 뷰 상태
  const [viewingDate, setViewingDate] = useState(new Date());
  
  // 투표 데이터 및 멤버 상태
  const [votes, setVotes] = useState([]); 
  const [voterName, setVoterName] = useState('');
  const [voterEmoji, setVoterEmoji] = useState('😎');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [voterSelections, setVoterSelections] = useState([]);
  const [copied, setCopied] = useState(false);
  const [hasVoted, setHasVoted] = useState(false); // 투표 완료 여부
  const [errors, setErrors] = useState({ title: false, dates: false, name: false, selections: false });

  // 에러 메시지(토스트) 상태
  const [toast, setToast] = useState({ visible: false, message: '' });

  const emojis = ['😎', '🥳', '👽', '🤖', '👻', '😻', '🐶', '🦊', '🐻', '🐼', '🐰', '🐯', '🐸', '🦄', '🐙', '🦖'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // 토스트 메시지 띄우기
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

  const todayStr = formatDate(new Date());

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

    if (dateStr < startDate || dateStr > endDate) return;
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

  const handleCreateLink = () => {
    let hasError = false;
    const newErrors = { ...errors };

    if (!title.trim()) {
      showToast('모임 이름을 입력해주세요.');
      newErrors.title = true;
      hasError = true;
    } else newErrors.title = false;

    if (!startDate || !endDate) {
      if (!hasError) showToast('시작일과 종료일을 모두 선택해주세요.');
      newErrors.dates = true;
      hasError = true;
    } else newErrors.dates = false;

    setErrors(newErrors);
    if (hasError) return;
    
    if (rules.allowedDays.length > 0) {
      let hasValidDay = false;
      let curr = parseDate(startDate);
      const end = parseDate(endDate);
      while (curr <= end) {
        if (rules.allowedDays.includes(curr.getDay())) {
          hasValidDay = true;
          break;
        }
        curr.setDate(curr.getDate() + 1);
      }
      if (!hasValidDay) return showToast('설정한 기간 내에 허용된 요일이 하루도 없습니다.');
    }

    setStep('link');
    setViewingDate(parseDate(startDate));
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
    let hasError = false;
    const newErrors = { ...errors };

    if (!voterName.trim()) {
      showToast('이름을 입력해주세요.');
      newErrors.name = true;
      hasError = true;
    } else newErrors.name = false;

    if (voterSelections.length === 0) {
      if (!hasError) showToast('가능한 날짜를 최소 1개 이상 선택해주세요.');
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
    setHasVoted(true); // 투표 완료 상태로 변경
  };

  const getResults = () => {
    const results = {};
    if (startDate && endDate) {
      let curr = parseDate(startDate);
      const end = parseDate(endDate);
      while(curr <= end) {
        if (rules.allowedDays.length === 0 || rules.allowedDays.includes(curr.getDay())) {
          results[formatDate(curr)] = [];
        }
        curr.setDate(curr.getDate() + 1);
      }
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12 sm:pb-24 selection:bg-gray-900 selection:text-white">
      
      {/* 토스트 메시지 */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0" />
          {toast.message}
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-6 sm:pt-10 md:pt-16 px-3 sm:px-6">
        
        {/* 헤더 */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center justify-center p-2.5 bg-white rounded-xl mb-2 sm:mb-3 shadow-sm border border-gray-200">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1.5 sm:mb-2">
            우리 언제 만나?
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">복잡한 과정 없이 깔끔하게 약속을 잡아보세요.</p>
        </div>

        {/* --- STEP 1: 방장 모임 생성 --- */}
        {step === 'create' && (
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">모임 만들기</h2>
            
            <div className="space-y-5 sm:space-y-6">
              {/* 모임 이름 */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">모임 이름</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: false }));
                  }}
                  placeholder="예) 강남역 저녁 모임 🍻" 
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-xl text-sm sm:text-base font-medium outline-none transition-all border ${
                    errors.title ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100' : 'border-transparent focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-100'
                  }`}
                />
              </div>

              {/* 투표 기간 선택 */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  투표 기간 설정
                </label>
                <div className={`bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all border ${
                  errors.dates ? 'border-red-300' : 'border-transparent'
                }`}>
                  <div className="flex justify-between items-center mb-3 sm:mb-5">
                    <button onClick={handlePrevMonth} className="p-1 sm:p-1.5 hover:bg-gray-200 rounded-lg transition-all text-gray-600"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                    <div className="font-bold text-sm sm:text-base text-gray-900">{year}년 {month + 1}월</div>
                    <button onClick={handleNextMonth} className="p-1 sm:p-1.5 hover:bg-gray-200 rounded-lg transition-all text-gray-600"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-2 sm:gap-y-3 text-center mb-1.5 sm:mb-2">
                    {dayNames.map((day, i) => (
                      <div key={day} className={`text-[10px] sm:text-xs font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-1 sm:gap-y-2 text-center relative mt-1 sm:mt-2">
                    {calendarDays.map((dateObj, i) => {
                      if (!dateObj) return <div key={`empty-${i}`} className="py-1 sm:py-1.5"></div>;
                      
                      const dateStr = formatDate(dateObj);
                      const isPast = dateStr < todayStr;
                      const isStart = dateStr === startDate;
                      const isEnd = dateStr === endDate;
                      const isBetween = startDate && endDate && dateStr > startDate && dateStr < endDate;

                      return (
                        <div key={dateStr} className="relative py-0.5 sm:py-1">
                          {isBetween && <div className="absolute inset-y-0.5 sm:inset-y-1 inset-x-0 bg-gray-200"></div>}
                          {isStart && endDate && <div className="absolute inset-y-0.5 sm:inset-y-1 right-0 w-1/2 bg-gray-200"></div>}
                          {isEnd && startDate && <div className="absolute inset-y-0.5 sm:inset-y-1 left-0 w-1/2 bg-gray-200"></div>}
                          
                          <button
                            onClick={() => handleHostDateClick(dateObj)}
                            disabled={isPast}
                            className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 mx-auto flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
                              isPast ? 'text-gray-300 cursor-not-allowed' :
                              isStart || isEnd ? 'bg-gray-900 text-white shadow-md' : 
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

              {/* 투표 규칙 옵션 */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-3 sm:mb-4">
                  <Settings className="w-3.5 h-3.5 text-gray-500" /> 상세 규칙
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer w-max group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={rules.allowedDays.length > 0}
                          onChange={() => setRules(prev => ({...prev, allowedDays: prev.allowedDays.length > 0 ? [] : [1,2,3,4,5]}))}
                          className="peer appearance-none w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-md border border-gray-300 checked:bg-gray-900 checked:border-gray-900 transition-all"
                        />
                        <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">특정 요일 지정</span>
                    </label>
                    {rules.allowedDays.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 pl-6 sm:pl-7 mt-2.5">
                        {dayNames.map((day, idx) => (
                          <button
                            key={day}
                            onClick={() => toggleAllowedDay(idx)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-semibold transition-all ${
                              rules.allowedDays.includes(idx) 
                                ? 'bg-gray-900 text-white' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={rules.singleDayOnly}
                          onChange={(e) => setRules({...rules, singleDayOnly: e.target.checked})}
                          className="peer appearance-none w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-md border border-gray-300 checked:bg-gray-900 checked:border-gray-900 transition-all"
                        />
                        <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">1인 1일 선택</span>
                    </label>
                    
                    <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={rules.anonymous}
                          onChange={(e) => setRules({...rules, anonymous: e.target.checked})}
                          className="peer appearance-none w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-md border border-gray-300 checked:bg-gray-900 checked:border-gray-900 transition-all"
                        />
                        <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">익명 투표</span>
                    </label>

                    <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group col-span-2 sm:col-span-1">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={rules.hideResults}
                          onChange={(e) => setRules({...rules, hideResults: e.target.checked})}
                          className="peer appearance-none w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-md border border-gray-300 checked:bg-gray-900 checked:border-gray-900 transition-all"
                        />
                        <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">투표 전 결과 블라인드</span>
                    </label>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCreateLink}
                className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base text-white bg-gray-900 hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" /> 투표 방 만들기
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: 링크 공유 --- */}
        {step === 'link' && (
          <div className="bg-white p-5 sm:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 max-w-sm mx-auto text-center animate-fade-in-up">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <CheckCircle2 className="w-6 h-6 sm:w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">투표 준비 완료!</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">링크를 복사해서 친구들에게 공유하세요.</p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-50 p-1.5 sm:pl-3 rounded-xl border border-gray-200 mb-5 sm:mb-6">
              <input 
                type="text" 
                readOnly 
                value="https://meetup.app/m/dummy-link-123" 
                className="bg-transparent flex-1 outline-none text-gray-700 text-xs sm:text-sm font-medium truncate p-2 sm:p-0 text-center sm:text-left"
              />
              <button 
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1 bg-white text-gray-900 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-semibold transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>

            <button 
              onClick={() => setStep('vote')}
              className="w-full py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gray-900 hover:bg-gray-800 transition-all"
            >
              투표 페이지로 가기
            </button>
          </div>
        )}

        {/* --- STEP 3: 멤버 투표 화면 --- */}
        {step === 'vote' && (
          <div className="space-y-3 sm:space-y-5">
            
            {/* 상단 정보 배너 */}
            <div className="bg-white p-4 sm:p-5 md:px-6 md:py-5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2 text-gray-900">{title}</h2>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                  <span className="text-gray-700 bg-gray-100 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg flex items-center gap-1 sm:gap-1.5 font-medium">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {startDate} ~ {endDate}
                  </span>
                  {rules.singleDayOnly && <span className="text-red-700 bg-red-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-medium border border-red-100">1인 1일</span>}
                  {rules.anonymous && <span className="text-gray-600 bg-gray-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-medium border border-gray-200">익명 투표</span>}
                  {rules.hideResults && <span className="text-blue-700 bg-blue-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-medium border border-blue-100">블라인드</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 border border-gray-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold text-gray-700 w-max">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
                <span>총 <span className="text-gray-900">{votes.length}</span>명 참여</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-3 sm:gap-5">
              {/* 왼쪽: 투표 입력 영역 */}
              <div className="lg:col-span-7 space-y-3 sm:space-y-5">
                
                {/* 1. 프로필 위젯 */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 text-gray-900">
                    <span className="bg-gray-100 text-gray-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold">1</span>
                    프로필 입력
                  </h3>
                  
                  <div className="flex gap-2 sm:gap-3">
                    <div className="relative">
                      <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl text-lg sm:text-xl hover:bg-gray-100 transition-all focus:ring-2 focus:ring-gray-900 outline-none shrink-0"
                      >
                        {voterEmoji}
                      </button>
                      
                      {showEmojiPicker && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)}></div>
                          <div className="absolute top-12 sm:top-14 left-0 z-20 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl p-2 w-[220px] sm:w-[260px] grid grid-cols-4 gap-1.5">
                            {emojis.map(e => (
                              <button
                                key={e}
                                onClick={() => { setVoterEmoji(e); setShowEmojiPicker(false); }}
                                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl hover:bg-gray-50 rounded-lg transition-all"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <input 
                      type="text" 
                      value={voterName}
                      onChange={(e) => {
                        setVoterName(e.target.value);
                        if (errors.name) setErrors(prev => ({ ...prev, name: false }));
                      }}
                      placeholder="이름을 알려주세요" 
                      className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium outline-none transition-all border w-0 ${
                        errors.name ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-transparent focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-100'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. 날짜 선택 위젯 */}
                <div className={`bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm transition-all border ${errors.selections ? 'border-red-300' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3 sm:mb-5">
                    <h3 className="text-sm sm:text-base font-bold flex items-center gap-1.5 sm:gap-2 text-gray-900">
                      <span className="bg-gray-100 text-gray-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold">2</span>
                      날짜 선택
                    </h3>
                    <div className="flex gap-1 bg-gray-50 rounded-lg sm:rounded-xl p-1 border border-gray-100">
                       <button onClick={handlePrevMonth} className="p-1 sm:p-1.5 hover:bg-white rounded-md shadow-sm transition-all"><ChevronLeft className="w-3.5 h-3.5 text-gray-700"/></button>
                       <div className="font-bold text-gray-900 px-2 sm:px-3 flex items-center text-xs sm:text-sm">{year}년 {month + 1}월</div>
                       <button onClick={handleNextMonth} className="p-1 sm:p-1.5 hover:bg-white rounded-md shadow-sm transition-all"><ChevronRight className="w-3.5 h-3.5 text-gray-700"/></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-1.5 sm:mb-2">
                    {dayNames.map((day, i) => (
                      <div key={day} className={`text-[10px] sm:text-xs font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {calendarDays.map((dateObj, i) => {
                      if (!dateObj) return <div key={`empty-${i}`} className="h-10 sm:h-14"></div>;
                      
                      const dateStr = formatDate(dateObj);
                      const isVoteInRange = dateStr >= startDate && dateStr <= endDate;
                      const isDayAllowed = rules.allowedDays.length === 0 || rules.allowedDays.includes(dateObj.getDay());
                      const isSelectable = isVoteInRange && isDayAllowed;
                      const isVotedByMe = voterSelections.includes(dateStr);
                      const voteCount = results[dateStr] ? results[dateStr].length : 0;
                      
                      return (
                        <button
                          key={dateStr}
                          disabled={!isSelectable}
                          onClick={() => handleMemberDateClick(dateObj)}
                          className={`h-10 sm:h-14 flex flex-col items-center justify-center rounded-lg sm:rounded-xl transition-all relative overflow-hidden border ${
                            !isSelectable ? 'opacity-30 cursor-not-allowed bg-gray-50 border-transparent' :
                            isVotedByMe ? 'bg-gray-900 text-white shadow-sm border-gray-900' : 
                            'bg-white hover:border-gray-900 hover:bg-gray-50 text-gray-900 border-gray-200'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-bold mt-0.5 sm:mt-1">
                            {dateObj.getDate()}
                          </span>
                          
                          <div className="mt-auto mb-0.5 sm:mb-1 h-3 sm:h-4 flex items-center">
                            {voteCount > 0 && isSelectable && !rules.hideResults && (
                              <span className={`text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0 sm:py-0.5 rounded sm:rounded-md ${isVotedByMe ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {voteCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={handleSubmitVote}
                    className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base text-white bg-gray-900 hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    이 날짜로 제출하기
                  </button>
                </div>
              </div>

              {/* 오른쪽: 결과 요약 */}
              <div className="lg:col-span-5 self-start sticky top-4">
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-5 flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-900">결과 현황</span>
                  </h3>
                  
                  {rules.hideResults && !hasVoted ? (
                    <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl border border-dashed border-gray-200">
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gray-400 mb-1.5 sm:mb-2" />
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">투표를 완료해야<br/>결과를 확인할 수 있습니다.</p>
                    </div>
                  ) : votes.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">아직 투표 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 sm:space-y-3 max-h-[300px] sm:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(results)
                        .filter(([_, arr]) => arr.length > 0)
                        .sort((a, b) => b[1].length - a[1].length) 
                        .map(([date, availablePeople], idx) => {
                          const count = availablePeople.length;
                          const isBest = count === maxVotes && count > 0;
                          
                          return (
                            <div key={date} className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all ${isBest ? 'bg-gray-50 border border-gray-200' : 'bg-white border border-gray-100'}`}>
                              <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className={`font-bold text-sm sm:text-base ${isBest ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {date}
                                  </span>
                                  {isBest && <span className="text-[9px] sm:text-[10px] font-bold text-gray-900 bg-gray-200 px-1.5 py-0.5 rounded-sm sm:rounded-md">Best</span>}
                                </div>
                                <span className="text-gray-900 text-xs sm:text-sm font-bold">{count}명</span>
                              </div>
                              
                              <div className="w-full bg-gray-100 rounded-full h-1 sm:h-1.5 mb-2.5 sm:mb-3 overflow-hidden">
                                <div 
                                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-1000 ${isBest ? 'bg-gray-900' : 'bg-gray-300'}`}
                                  style={{ width: `${(count / votes.length) * 100}%` }}
                                ></div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                {availablePeople.map((person, pIdx) => (
                                  rules.anonymous ? (
                                    <span key={pIdx} className="text-[9px] sm:text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-1 rounded-md">
                                      익명
                                    </span>
                                  ) : (
                                    <div key={pIdx} className="group/tooltip relative">
                                      <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-xs sm:text-sm cursor-help hover:border-gray-900 transition-all">
                                        {person.emoji}
                                      </div>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tooltip:block whitespace-nowrap bg-gray-900 text-white text-[9px] sm:text-[10px] font-medium px-2 py-1 rounded-md shadow-lg z-10 pointer-events-none">
                                        {person.name}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-900"></div>
                                      </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
