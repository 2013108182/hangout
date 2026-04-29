import React, { useState, useEffect } from 'react';
import { Calendar, Users, ChevronLeft, ChevronRight, Copy, Check, CheckCircle2, Settings, Smile, AlertCircle, Sparkles, Lock, Clock, X, Loader2 } from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// 💡 [여기입니다!] 사용자님의 진짜 DB(Firebase) 주소를 적는 곳
const myFirebaseConfig = {
  apiKey: "AIzaSyBkek39lk9xpxIKJFMKXUg3CmqYSpk27wY",
  authDomain: "hangout-planner-a4593.firebaseapp.com",
  projectId: "hangout-planner-a4593",
  storageBucket: "hangout-planner-a4593.firebasestorage.app",
  messagingSenderId: "459790139576",
  appId: "1:459790139576:web:88e74266804bb5f1efb44d",
  measurementId: "G-7DDY04HM2N"
};

// --- Firebase Init ---
// 채팅창 가상 환경이면 가상 DB를, 배포 시엔 사용자님의 DB(myFirebaseConfig)를 사용합니다.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : myFirebaseConfig;
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'meetup-app';

export default function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('loading'); // 'loading', 'create', 'link', 'vote'
  const [meetupId, setMeetupId] = useState(null);
  
  // 방장 설정 상태
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [deadline, setDeadline] = useState('');
  const [dateMode, setDateMode] = useState('range'); 
  const [specificDates, setSpecificDates] = useState([]);
  const [rules, setRules] = useState({ allowedDays: [], singleDayOnly: false, anonymous: false, hideResults: false });
  
  // 뷰 및 투표 상태
  const [viewingDate, setViewingDate] = useState(new Date());
  const [votes, setVotes] = useState([]); 
  const [voterName, setVoterName] = useState('');
  const [voterEmoji, setVoterEmoji] = useState('😎');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [voterSelections, setVoterSelections] = useState([]);
  
  // UI 상태
  const [copied, setCopied] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [errors, setErrors] = useState({ title: false, dates: false, name: false, selections: false });
  const [toast, setToast] = useState({ visible: false, message: '' });

  const emojis = ['😎', '🥳', '👽', '🤖', '👻', '😻', '🐶', '🦊', '🐻', '🐼', '🐰', '🐯', '🐸', '🦄', '🐙', '🦖'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // --- 1. 인증 및 URL 라우팅 ---
  useEffect(() => {
    if (!auth) { setStep('create'); return; }
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth init failed", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // URL 확인하여 투표 방인지 판단
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setMeetupId(id);
    } else {
      setStep('create');
    }
  }, []);

  // --- 2. 실시간 데이터베이스 연동 ---
  useEffect(() => {
    if (!user || !meetupId || !db) return;
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'meetups', meetupId);
    setStep('loading');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setStartDate(data.startDate || null);
        setEndDate(data.endDate || null);
        setDeadline(data.deadline || '');
        setDateMode(data.dateMode || 'range');
        setSpecificDates(data.specificDates || []);
        setRules(data.rules || { allowedDays: [], singleDayOnly: false, anonymous: false, hideResults: false });
        setVotes(data.votes || []);
        setStep(step === 'link' ? 'link' : 'vote'); // 방금 만든 사람은 link 화면 유지, 아니면 vote로 이동
      } else {
        showToast("존재하지 않는 모임 링크입니다.");
        setStep('create');
      }
    }, (err) => {
      console.error(err);
      showToast("데이터를 불러오는 중 오류가 발생했습니다.");
    });

    return () => unsubscribe();
  }, [user, meetupId, db]);


  // --- Helper Functions ---
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
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const todayStr = formatDate(new Date());
  const isExpired = deadline ? new Date() >= new Date(deadline) : false;
  const shouldHideResults = rules.hideResults && !hasVoted && !isExpired;

  const year = viewingDate.getFullYear();
  const month = viewingDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const calendarDays = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => new Date(year, month, i + 1)));

  const handlePrevMonth = () => setViewingDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewingDate(new Date(year, month + 1, 1));

  // --- 이벤트 핸들러 ---
  const handleHostDateClick = (dateObj) => {
    if (!dateObj) return;
    const dateStr = formatDate(dateObj);
    if (dateStr < todayStr) return; 

    if (errors.dates) setErrors(prev => ({ ...prev, dates: false }));
    
    if (dateMode === 'specific') {
      setSpecificDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort());
    } else {
      if (!startDate || (startDate && endDate)) { setStartDate(dateStr); setEndDate(null); }
      else { dateStr < startDate ? setStartDate(dateStr) : setEndDate(dateStr); }
    }
  };

  const handleMemberDateClick = (dateObj) => {
    if (!dateObj) return;
    const dateStr = formatDate(dateObj);
    const isVoteInRange = dateMode === 'range' ? (dateStr >= startDate && dateStr <= endDate) : specificDates.includes(dateStr);

    if (!isVoteInRange || (rules.allowedDays.length > 0 && !rules.allowedDays.includes(dateObj.getDay()))) return;
    if (errors.selections) setErrors(prev => ({ ...prev, selections: false }));

    if (rules.singleDayOnly) {
      setVoterSelections(voterSelections.includes(dateStr) ? [] : [dateStr]);
    } else {
      setVoterSelections(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
    }
  };

  // 💡 방 생성 로직 (DB 저장 & URL 파라미터 변경)
  const handleCreateLink = async () => {
    if (!db) return showToast("DB 설정이 필요합니다. 상단의 myFirebaseConfig를 입력해주세요!");
    if (!user) return showToast("서버 연결 중입니다. 잠시만 기다려주세요.");
    
    let hasError = false;
    const newErrors = { ...errors };

    if (!title.trim()) { showToast('모임 이름을 입력해주세요.'); newErrors.title = true; hasError = true; }
    else newErrors.title = false;

    if (dateMode === 'range' && (!startDate || !endDate)) { if (!hasError) showToast('범위를 선택해주세요.'); newErrors.dates = true; hasError = true; }
    else if (dateMode === 'specific' && specificDates.length === 0) { if (!hasError) showToast('날짜를 1개 이상 선택해주세요.'); newErrors.dates = true; hasError = true; }
    else newErrors.dates = false;

    setErrors(newErrors);
    if (hasError) return;

    // 클라우드 데이터베이스에 방 정보 저장
    try {
      setStep('loading');
      const newId = crypto.randomUUID().split('-')[0]; // 고유 짧은 ID 생성
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'meetups', newId);
      
      await setDoc(docRef, {
        title, startDate, endDate, deadline, dateMode, specificDates, rules, votes: [], host: user.uid, createdAt: new Date().toISOString()
      });

      setMeetupId(newId);
      setStep('link');
      
      // 화면 새로고침 없이 URL만 업데이트 (?id=xxx)
      window.history.pushState({}, '', `?id=${newId}`);
    } catch (err) {
      console.error(err);
      showToast("방 생성에 실패했습니다.");
      setStep('create');
    }
  };

  const handleCopyLink = () => {
    const el = document.createElement('textarea');
    el.value = window.location.href; // 실제 접속 URL 복사
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 💡 투표 로직 (DB 업데이트)
  const handleSubmitVote = async () => {
    if (isExpired) return showToast('투표가 마감되었습니다.');
    if (!user || !db || !meetupId) return;

    let hasError = false;
    const newErrors = { ...errors };

    if (!voterName.trim()) { showToast('이름을 입력해주세요.'); newErrors.name = true; hasError = true; }
    else newErrors.name = false;

    if (voterSelections.length === 0) { if(!hasError) showToast('가능한 날짜를 선택하세요.'); newErrors.selections = true; hasError = true; }
    else newErrors.selections = false;

    setErrors(newErrors);
    if (hasError) return;

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'meetups', meetupId);
      const newVoteData = { name: voterName.trim(), emoji: voterEmoji, available: voterSelections, uid: user.uid };
      
      // 동일한 이름이 있으면 덮어씌우기
      const updatedVotes = [...votes.filter(v => v.name !== newVoteData.name), newVoteData];
      await updateDoc(docRef, { votes: updatedVotes });
      
      setVoterName('');
      setVoterSelections([]);
      setVoterEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
      setHasVoted(true); 
      showToast('투표가 완료되었습니다!');
    } catch (err) {
      console.error(err);
      showToast('투표 저장에 실패했습니다.');
    }
  };

  const getResults = () => {
    const results = {};
    if (dateMode === 'range' && startDate && endDate) {
      let curr = parseDate(startDate);
      const end = parseDate(endDate);
      while(curr <= end) {
        if (rules.allowedDays.length === 0 || rules.allowedDays.includes(curr.getDay())) results[formatDate(curr)] = [];
        curr.setDate(curr.getDate() + 1);
      }
    } else if (dateMode === 'specific') {
      specificDates.forEach(date => {
        const d = parseDate(date);
        if (rules.allowedDays.length === 0 || rules.allowedDays.includes(d.getDay())) results[date] = [];
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

  // 로딩 화면
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-600">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] overflow-y-auto bg-gray-50 text-gray-900 font-sans selection:bg-gray-900 selection:text-white relative">
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl font-medium text-[11px] sm:text-xs flex items-center gap-1.5 whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          {toast.message}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-3 sm:p-4 pb-8">
        
        {step !== 'vote' && (
          <div className="text-center mb-6 mt-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">우리 언제 만나?</h1>
            <p className="text-xs text-gray-500">가장 빠르고 깔끔한 약속 잡기</p>
          </div>
        )}

        {/* --- STEP 1: 방장 모임 생성 --- */}
        {step === 'create' && (
          <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-xl mx-auto">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">모임 이름</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 강남역 저녁 모임 🍻" 
                  className={`w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium outline-none border ${errors.title ? 'border-red-300 bg-red-50' : 'border-transparent focus:border-gray-900 focus:bg-white'}`}/>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">약속 후보 날짜</label>
                  <div className="flex bg-gray-100 p-0.5 rounded-lg">
                    <button onClick={() => setDateMode('range')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${dateMode === 'range' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>시작~종료</button>
                    <button onClick={() => setDateMode('specific')} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${dateMode === 'specific' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>콕콕 찍기</button>
                  </div>
                </div>
                
                <div className={`bg-gray-50 rounded-xl p-3 sm:p-4 border ${errors.dates ? 'border-red-300' : 'border-transparent'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-md text-gray-600"><ChevronLeft className="w-5 h-5"/></button>
                    <div className="font-bold text-sm text-gray-900">{year}년 {month + 1}월</div>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-md text-gray-600"><ChevronRight className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-1 text-center mb-1">
                    {dayNames.map((day, i) => <div key={day} className={`text-[10px] font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</div>)}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-0.5 text-center relative mt-2">
                    {calendarDays.map((dateObj, i) => {
                      if (!dateObj) return <div key={`empty-${i}`} className="py-1"></div>;
                      const dateStr = formatDate(dateObj);
                      const isPast = dateStr < todayStr;
                      const isStart = dateMode === 'range' && dateStr === startDate;
                      const isEnd = dateMode === 'range' && dateStr === endDate;
                      const isBetween = dateMode === 'range' && startDate && endDate && dateStr > startDate && dateStr < endDate;
                      const isSpecificSelected = dateMode === 'specific' && specificDates.includes(dateStr);

                      return (
                        <div key={dateStr} className="relative py-1">
                          {isBetween && <div className="absolute inset-y-1 inset-x-0 bg-gray-200 pointer-events-none"></div>}
                          {isStart && endDate && <div className="absolute inset-y-1 right-0 w-1/2 bg-gray-200 pointer-events-none"></div>}
                          {isEnd && startDate && <div className="absolute inset-y-1 left-0 w-1/2 bg-gray-200 pointer-events-none"></div>}
                          <button
                            onClick={() => handleHostDateClick(dateObj)} disabled={isPast}
                            className={`relative z-10 w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                              isPast ? 'text-gray-300 cursor-not-allowed' :
                              isStart || isEnd || isSpecificSelected ? 'bg-gray-900 text-white shadow-md' : 
                              isBetween ? 'text-gray-900' : 'hover:bg-gray-200 text-gray-700 bg-transparent'
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

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">마감 기한 (선택)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Clock className="w-4 h-4 text-gray-400" /></div>
                  <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 rounded-xl text-xs font-bold outline-none transition-all border border-transparent focus:border-gray-900 focus:bg-white text-gray-800"/>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mb-3"><Settings className="w-3.5 h-3.5 text-gray-500" /> 세부 규칙</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="rule1" checked={rules.allowedDays.length > 0} onChange={() => setRules(prev => ({...prev, allowedDays: prev.allowedDays.length > 0 ? [] : [1,2,3,4,5]}))} className="w-4 h-4 rounded border-gray-300 text-gray-900 cursor-pointer" />
                    <label htmlFor="rule1" className="text-xs font-bold text-gray-700 cursor-pointer">특정 요일만 허용</label>
                  </div>
                  {rules.allowedDays.length > 0 && (
                    <div className="flex gap-1.5 pl-6">
                      {dayNames.map((day, idx) => (
                        <button key={day} onClick={() => toggleAllowedDay(idx)} className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${rules.allowedDays.includes(idx) ? 'bg-gray-900 text-white' : 'bg-white border text-gray-500 hover:bg-gray-100'}`}>{day}</button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2"><input type="checkbox" id="rule2" checked={rules.singleDayOnly} onChange={(e) => setRules({...rules, singleDayOnly: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-gray-900 cursor-pointer"/><label htmlFor="rule2" className="text-xs font-bold text-gray-700 cursor-pointer">1인 1일 선택</label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="rule3" checked={rules.anonymous} onChange={(e) => setRules({...rules, anonymous: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-gray-900 cursor-pointer"/><label htmlFor="rule3" className="text-xs font-bold text-gray-700 cursor-pointer">익명 투표</label></div>
                    <div className="flex items-center gap-2 col-span-2"><input type="checkbox" id="rule4" checked={rules.hideResults} onChange={(e) => setRules({...rules, hideResults: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-gray-900 cursor-pointer"/><label htmlFor="rule4" className="text-xs font-bold text-gray-700 cursor-pointer">투표 전 결과 블라인드</label></div>
                  </div>
                </div>
              </div>

              <button onClick={handleCreateLink} className="w-full py-4 rounded-xl font-bold text-sm text-white bg-gray-900 hover:bg-gray-800 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> 투표 방 만들기
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: 링크 공유 --- */}
        {step === 'link' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-sm mx-auto text-center mt-10">
            <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold mb-1.5">방 생성 완료!</h2>
            <p className="text-xs text-gray-500 mb-6">아래 링크를 카톡이나 문자로 공유하세요.</p>
            
            <div className="flex flex-col gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 mb-6">
              <input readOnly value={window.location.href} className="bg-transparent w-full outline-none text-gray-700 text-xs font-medium text-center p-1" />
              <button onClick={handleCopyLink} className="w-full bg-white border border-gray-200 py-2 rounded-lg text-xs font-bold shadow-sm">
                {copied ? '✅ 복사 완료' : '복사하기'}
              </button>
            </div>

            <button onClick={() => setStep('vote')} className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gray-900">
              투표 화면으로 입장
            </button>
          </div>
        )}

        {/* --- STEP 3: 멤버 투표 화면 --- */}
        {step === 'vote' && (
          <div className="grid md:grid-cols-12 gap-4 mt-2">
            
            <div className="md:col-span-7 space-y-3">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-2">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-bold">{dateMode === 'range' ? `${startDate} ~ ${endDate}` : `${specificDates.length}개 날짜`}</span>
                  {deadline && <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-md border border-orange-100 flex items-center gap-1"><Clock className="w-3 h-3"/> {formatDateTimeUI(deadline)} 마감</span>}
                  {rules.singleDayOnly && <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-md border border-red-100">1인1일</span>}
                  {rules.anonymous && <span className="text-[10px] font-bold bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-200">익명</span>}
                </div>
              </div>

              {isExpired ? (
                <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center min-h-[250px]">
                  <Clock className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="text-base font-bold text-gray-700">투표가 마감되었습니다.</p>
                  <p className="text-xs text-gray-500 mt-1">설정된 기한이 지났습니다.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="bg-gray-100 text-gray-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div className="relative shrink-0">
                      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg text-xl flex items-center justify-center">{voterEmoji}</button>
                      {showEmojiPicker && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)}></div>
                          <div className="absolute top-12 left-0 z-20 bg-white border rounded-xl shadow-xl p-2 w-[260px] grid grid-cols-6 gap-1">
                            {emojis.map(e => <button key={e} onClick={() => { setVoterEmoji(e); setShowEmojiPicker(false); }} className="w-8 h-8 text-xl hover:bg-gray-50 rounded-lg">{e}</button>)}
                          </div>
                        </>
                      )}
                    </div>
                    <input type="text" value={voterName} onChange={(e) => { setVoterName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: false })); }} placeholder="이름 입력" 
                      className={`flex-1 px-3 py-2.5 bg-gray-50 rounded-lg text-sm font-bold outline-none border ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-100 focus:border-gray-900 focus:bg-white'}`}/>
                  </div>

                  <div className={`bg-white p-4 rounded-xl shadow-sm border ${errors.selections ? 'border-red-300' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><div className="bg-gray-100 text-gray-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</div><span className="text-xs font-bold text-gray-900">날짜 선택</span></div>
                      <div className="flex gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                         <button onClick={handlePrevMonth} className="p-1"><ChevronLeft className="w-4 h-4 text-gray-700"/></button>
                         <div className="font-bold text-gray-900 px-2 flex items-center text-xs">{month + 1}월</div>
                         <button onClick={handleNextMonth} className="p-1"><ChevronRight className="w-4 h-4 text-gray-700"/></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {dayNames.map((day, i) => <div key={day} className={`text-[10px] font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</div>)}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1.5">
                      {calendarDays.map((dateObj, i) => {
                        if (!dateObj) return <div key={`empty-${i}`} className="h-10"></div>;
                        const dateStr = formatDate(dateObj);
                        const isVoteInRange = dateMode === 'range' ? (dateStr >= startDate && dateStr <= endDate) : specificDates.includes(dateStr);
                        const isDayAllowed = rules.allowedDays.length === 0 || rules.allowedDays.includes(dateObj.getDay());
                        const isSelectable = isVoteInRange && isDayAllowed;
                        const isVotedByMe = voterSelections.includes(dateStr);
                        const voteCount = results[dateStr] ? results[dateStr].length : 0;
                        
                        return (
                          <button key={dateStr} disabled={!isSelectable} onClick={() => handleMemberDateClick(dateObj)}
                            className={`h-10 flex flex-col items-center justify-center rounded-lg transition-all border ${
                              !isSelectable ? 'opacity-30 cursor-not-allowed bg-gray-50 border-transparent' :
                              isVotedByMe ? 'bg-gray-900 text-white shadow-sm border-gray-900' : 'bg-white hover:border-gray-900 text-gray-900 border-gray-200'
                            }`}
                          >
                            <span className="text-xs font-bold">{dateObj.getDate()}</span>
                            <div className="h-3 flex items-center">
                              {voteCount > 0 && isSelectable && !rules.hideResults && <span className={`text-[8px] font-bold px-1 rounded ${isVotedByMe ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}`}>{voteCount}</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={handleSubmitVote} className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-white bg-gray-900 hover:bg-gray-800">이 날짜로 제출</button>
                  </div>
                </>
              )}
            </div>

            <div className="md:col-span-5 self-start">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">결과 현황</h3>
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-bold">총 {votes.length}명 참여</span>
                </div>
                
                {shouldHideResults ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Lock className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500 font-bold">투표 완료 시 공개</p>
                  </div>
                ) : votes.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-500 font-bold">아직 투표 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {Object.entries(results).filter(([_, arr]) => arr.length > 0).sort((a, b) => b[1].length - a[1].length).map(([date, availablePeople]) => {
                        const count = availablePeople.length;
                        const isBest = count === maxVotes && count > 0;
                        return (
                          <div key={date} className={`relative p-3 rounded-xl border ${isBest ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-xs ${isBest ? 'text-gray-900' : 'text-gray-700'}`}>{date}</span>
                                {isBest && <span className="text-[9px] font-bold text-gray-900 bg-gray-200 px-1.5 py-0.5 rounded-md">Best</span>}
                              </div>
                              <span className="text-gray-900 text-xs font-bold">{count}명</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2.5 overflow-hidden">
                              <div className={`h-1.5 rounded-full transition-all ${isBest ? 'bg-gray-900' : 'bg-gray-300'}`} style={{ width: `${(count / votes.length) * 100}%` }}></div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {availablePeople.map((person, pIdx) => rules.anonymous ? (
                                  <span key={pIdx} className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">익명</span>
                                ) : (
                                  <div key={pIdx} className="group/tooltip relative">
                                    <div className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm text-xs cursor-help">{person.emoji}</div>
                                  </div>
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
