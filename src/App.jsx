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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24 selection:bg-gray-900 selection:text-white">
      
      {/* 토스트 메시지 */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl font-medium text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          {toast.message}
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-12 md:pt-20 px-4">
        
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl mb-4 shadow-sm border border-gray-200">
            <Calendar className="w-7 h-7 text-gray-900" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            우리 언제 만나?
          </h1>
          <p className="text-gray-500">복잡한 과정 없이 깔끔하게 약속을 잡아보세요.</p>
        </div>

        {/* --- STEP 1: 방장 모임 생성 --- */}
        {step === 'create' && (
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">모임 만들기</h2>
            
            <div className="space-y-8">
              {/* 모임 이름 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">모임 이름</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: false }));
                  }}
                  placeholder="예) 강남역 저녁 모임 🍻" 
                  className={`w-full px-5 py-4 bg-gray-50 rounded-2xl text-lg font-medium outline-none transition-all border ${
                    errors.title ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100' : 'border-transparent focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-100'
                  }`}
                />
              </div>

              {/* 투표 기간 선택 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  투표 기간 설정
                </label>
                <div className={`bg-gray-50 rounded-3xl p-6 transition-all border ${
                  errors.dates ? 'border-red-300' : 'border-transparent'
                }`}>
                  <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-600"><ChevronLeft className="w-5 h-5"/></button>
                    <div className="font-bold text-lg text-gray-900">{year}년 {month + 1}월</div>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 rounded-xl transition-all text-gray-600"><ChevronRight className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-4 text-center mb-2">
                    {dayNames.map((day, i) => (
                      <div key={day} className={`text-xs font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-2 text-center relative mt-2">
                    {calendarDays.map((dateObj, i) => {
                      if (!dateObj) return <div key={`empty-${i}`} className="py-2"></div>;
                      
                      const dateStr = formatDate(dateObj);
                      const isPast = dateStr < todayStr;
                      const isStart = dateStr === startDate;
                      const isEnd = dateStr === endDate;
                      const isBetween = startDate && endDate && dateStr > startDate && dateStr < endDate;

                      return (
                        <div key={dateStr} className="relative py-1">
                          {isBetween && <div className="absolute inset-y-1 inset-x-0 bg-gray-200"></div>}
                          {isStart && endDate && <div className="absolute inset-y-1 right-0 w-1/2 bg-gray-200"></div>}
                          {isEnd && startDate && <div className="absolute inset-y-1 left-0 w-1/2 bg-gray-200"></div>}
                          
                          <button
                            onClick={() => handleHostDateClick(dateObj)}
                            disabled={isPast}
                            className={`relative z-10 w-10 h-10 mx-auto flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
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
              <div className="bg-white rounded-3xl p-6 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-5">
                  <Settings className="w-4 h-4 text-gray-500" /> 상세 규칙
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer w-max group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={rules.allowedDays.length > 0}
                          onChange={() => setRules(prev => ({...prev, allowedDays: prev.allowedDays.length > 0 ? [] : [1,2,3,4,5]}))}
                          className="peer appearance-none w-5 h-5 rounded-md border border-gray-300 checked:bg-gray-900 checked:border-gray-900 transition-all"
                        />
                        <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">특정 요일 지정</span>
                    </label>
                    {rules.allowedDays.length > 0 && (
                      <div className="flex gap-2 pl-8 mt-3">
                        {dayNames.map((day, idx) => (
                          <button
                            key={day}
                            onClick={() => toggleAllowedDay(idx)}
                            className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
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

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={rules.singleDayOnly}
                          onChange={(e) => setRules({...rules, singleDayOnly: e.target.checked})}
                          className="peer appearance-none w-5 h-5 rounded-md border border-gray-300 checked:bg-gray-900 checked:border-gray-900 transition-all"
                        />
                        <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">1인 1일 선택</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={rules.anonymous}
                          onChange={(e) => setRules({...rules, anonymous: e.target.checked})}
                          className="peer appearance-none w-5 h-5 rounded-md border border-gray-300 checked:bg-gray-900 checked:border-gray-900 transition-all"
                        />
                        <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">익명 투표</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={rules.hideResults}
                          onChange={(e) => setRules({...rules, hideResults: e.target.checked})}
                          className="peer appearance-none w-5 h-5 rounded-md border border-gray-300 checked:bg-gray-900 checked:border-gray-900 transition-all"
                        />
                        <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">투표 전 결과 블라인드</span>
                    </label>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCreateLink}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gray-900 hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5" /> 투표 방 만들기
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: 링크 공유 --- */}
        {step === 'link' && (
          <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-200 max-w-md mx-auto text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">투표 준비 완료!</h2>
            <p className="text-gray-500 mb-8">링크를 복사해서 친구들에게 공유하세요.</p>
            
            <div className="flex items-center gap-2 bg-gray-50 p-2 pl-4 rounded-2xl border border-gray-200 mb-8">
              <input 
                type="text" 
                readOnly 
                value="https://meetup.app/m/dummy-link-123" 
                className="bg-transparent flex-1 outline-none text-gray-700 text-sm font-medium truncate"
              />
              <button 
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 bg-white text-gray-900 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>

            <button 
              onClick={() => setStep('vote')}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gray-900 hover:bg-gray-800 transition-all"
            >
              투표 페이지로 가기
            </button>
          </div>
        )}

        {/* --- STEP 3: 멤버 투표 화면 --- */}
        {step === 'vote' && (
          <div className="space-y-6">
            
            {/* 상단 정보 배너 */}
            <div className="bg-white p-6 md:px-8 md:py-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">{title}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium">
                    <Calendar className="w-4 h-4" />
                    {startDate} ~ {endDate}
                  </span>
                  {rules.singleDayOnly && <span className="text-red-700 bg-red-50 px-3 py-1.5 rounded-lg font-medium border border-red-100">1인 1일</span>}
                  {rules.anonymous && <span className="text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg font-medium border border-gray-200">익명 투표</span>}
                  {rules.hideResults && <span className="text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg font-medium border border-blue-100">블라인드</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-5 py-3 rounded-xl text-sm font-semibold text-gray-700 w-max">
                <Users className="w-4 h-4 text-gray-500" />
                <span>총 <span className="text-gray-900">{votes.length}</span>명 참여</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* 왼쪽: 투표 입력 영역 */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. 프로필 위젯 */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                    <span className="bg-gray-100 text-gray-600 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                    프로필 입력
                  </h3>
                  
                  <div className="flex gap-4">
                    <div className="relative">
                      <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="w-14 h-14 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-2xl text-2xl hover:bg-gray-100 transition-all focus:ring-2 focus:ring-gray-900 outline-none"
                      >
                        {voterEmoji}
                      </button>
                      
                      {showEmojiPicker && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)}></div>
                          <div className="absolute top-16 left-0 z-20 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 w-64 grid grid-cols-4 gap-2">
                            {emojis.map(e => (
                              <button
                                key={e}
                                onClick={() => { setVoterEmoji(e); setShowEmojiPicker(false); }}
                                className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-gray-50 rounded-xl transition-all"
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
                      className={`flex-1 px-5 py-4 bg-gray-50 rounded-2xl text-lg font-medium outline-none transition-all border ${
                        errors.name ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100' : 'border-transparent focus:border-gray-900 focus:bg-white focus:ring-4 focus:ring-gray-100'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. 날짜 선택 위젯 */}
                <div className={`bg-white p-8 rounded-[2rem] shadow-sm transition-all border ${errors.selections ? 'border-red-300' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                      <span className="bg-gray-100 text-gray-600 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                      날짜 선택
                    </h3>
                    <div className="flex gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
                       <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg shadow-sm transition-all"><ChevronLeft className="w-4 h-4 text-gray-700"/></button>
                       <div className="font-bold text-gray-900 px-4 flex items-center text-sm">{year}년 {month + 1}월</div>
                       <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg shadow-sm transition-all"><ChevronRight className="w-4 h-4 text-gray-700"/></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-3 text-center mb-4">
                    {dayNames.map((day, i) => (
                      <div key={day} className={`text-sm font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2 md:gap-3">
                    {calendarDays.map((dateObj, i) => {
                      if (!dateObj) return <div key={`empty-${i}`} className="aspect-square"></div>;
                      
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
                          className={`aspect-square flex flex-col items-center justify-center p-2 rounded-2xl transition-all relative overflow-hidden ${
                            !isSelectable ? 'opacity-30 cursor-not-allowed bg-gray-50' :
                            isVotedByMe ? 'bg-gray-900 text-white shadow-md' : 
                            'bg-white border border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900'
                          }`}
                        >
                          <span className="text-base font-bold mt-1">
                            {dateObj.getDate()}
                          </span>
                          
                          <div className="mt-auto mb-1 h-5 flex items-center">
                            {voteCount > 0 && isSelectable && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isVotedByMe ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
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
                    className="w-full mt-8 py-4 rounded-2xl font-bold text-lg text-white bg-gray-900 hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    이 날짜로 제출하기
                  </button>
                </div>
              </div>

              {/* 오른쪽: 결과 요약 */}
              <div className="lg:col-span-5 self-start sticky top-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold mb-6 flex items-center justify-between pb-4 border-b border-gray-100">
                    <span className="text-gray-900">결과 현황</span>
                  </h3>
                  
                  {rules.hideResults && !hasVoted ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Lock className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 font-medium">투표를 완료해야<br/>결과를 확인할 수 있습니다.</p>
                    </div>
                  ) : votes.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-gray-500 font-medium">아직 투표 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(results)
                        .filter(([_, arr]) => arr.length > 0)
                        .sort((a, b) => b[1].length - a[1].length) 
                        .map(([date, availablePeople], idx) => {
                          const count = availablePeople.length;
                          const isBest = count === maxVotes && count > 0;
                          
                          return (
                            <div key={date} className={`relative p-5 rounded-2xl transition-all ${isBest ? 'bg-gray-50 border border-gray-200' : 'bg-white border border-gray-100'}`}>
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                  <span className={`font-bold text-lg ${isBest ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {date}
                                  </span>
                                  {isBest && <span className="text-xs font-bold text-gray-900 bg-gray-200 px-2 py-1 rounded-md">Best</span>}
                                </div>
                                <span className="text-gray-900 text-sm font-bold">{count}명</span>
                              </div>
                              
                              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-1000 ${isBest ? 'bg-gray-900' : 'bg-gray-300'}`}
                                  style={{ width: `${(count / votes.length) * 100}%` }}
                                ></div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {availablePeople.map((person, pIdx) => (
                                  rules.anonymous ? (
                                    <span key={pIdx} className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg">
                                      익명
                                    </span>
                                  ) : (
                                    <div key={pIdx} className="group/tooltip relative">
                                      <div className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-lg cursor-help hover:border-gray-900 transition-all">
                                        {person.emoji}
                                      </div>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block whitespace-nowrap bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg z-10 pointer-events-none">
                                        {person.name}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
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