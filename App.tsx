
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User, Users, Brain, LogOut, ChevronRight, Eye, 
  Target, PlusCircle, Key, Trophy, MessageSquare,
  X, Check, Info, Settings, Trash2,
  Image as ImageIcon, Type, List, CheckCircle2,
  Plus, Layout, ArrowRight, Home, BarChart3,
  Sparkles, Heart, History, ShieldCheck, AlertCircle,
  FolderPlus, ChevronLeft, Save, SlidersHorizontal, BookOpen, Layers
} from 'lucide-react';
import { Room, UserProfile, StudentData, ViewState, Question, Challenge } from './types';
import { INITIAL_ROOMS, MOCK_STUDENTS } from './constants';
import { 
  generateScaffoldingPrompt, 
  generateWelcomeSafetyMessage, 
  generatePostTestReflectionPrompt 
} from './services/geminiService';

const App: React.FC = () => {
  // --- DATABASE & GLOBAL STATE ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [studentsData, setStudentsData] = useState<StudentData[]>(MOCK_STUDENTS); 
  const [view, setView] = useState<ViewState>('login'); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  
  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedRoomId) || null, [rooms, selectedRoomId]);
  const activeChallenge = useMemo(() => selectedRoom?.challenges.find(c => c.id === activeChallengeId) || null, [selectedRoom, activeChallengeId]);

  // --- DOSEN MONITORING STATE ---
  const [tiers, setTiers] = useState([
    { id: 1, label: "EXCELLENT GROWTH", min: 81, max: 100, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    { id: 2, label: "SOLID PROGRESS", min: 51, max: 80, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { id: 3, label: "NEED SCAFFOLDING", min: 0, max: 50, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" }
  ]);
  
  const [inspectingStudent, setInspectingStudent] = useState<StudentData | null>(null);
  const [showEditorial, setShowEditorial] = useState(false);

  // --- MAHASISWA SESSION STATE ---
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [lastFocusedField, setLastFocusedField] = useState("");
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, Record<string, string>>>({});
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [groupCode, setGroupCode] = useState(""); 
  const [showFactTestModal, setShowFactTestModal] = useState(false);
  const [studentFactAnswers, setStudentFactAnswers] = useState<string[]>([]);
  
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [aiReflections, setAiReflections] = useState<string[]>([]);

  // --- ACTIONS ---

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const nama = data.get('nama') as string;
    const pass = data.get('pass') as string;
    const role = data.get('role') as any;

    if(!nama || !pass) return alert("Harap isi data dengan lengkap.");
    const newUser: UserProfile = { nama, role, pass, joinedRooms: [] };
    setUsers(prev => [...prev, newUser]);
    setUserProfile(newUser);
    setView('dashboard');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const name = data.get('nama') as string;
    const pass = data.get('pass') as string;

    if (name === 'dosen' && pass === 'dosen') {
      setUserProfile({ nama: "Dosen Administrator", role: "dosen", pass: "dosen" });
      setView('dashboard');
      return;
    }

    const found = users.find(u => u.nama === name && u.pass === pass);
    if (found) {
      setUserProfile(found);
      setView('dashboard');
    } else {
      alert("Kredensial salah. Gunakan 'dosen'/'dosen' untuk masuk.");
    }
  };

  const syncToTeacher = useCallback((updatedData = {}) => {
    if (!userProfile || !selectedRoom) return;

    const calculateScore = (ansArray: string[]) => {
      if (!selectedRoom.questions || selectedRoom.questions.length === 0) return 0;
      let correctCount = 0;
      ansArray.forEach((ans, idx) => {
        const q = selectedRoom.questions[idx];
        if (ans && q && ans.trim().toLowerCase() === q.correct.trim().toLowerCase()) correctCount++;
      });
      return Math.round((correctCount / selectedRoom.questions.length) * 100);
    };

    const newData: StudentData = {
      id: userProfile.nama,
      name: userProfile.nama,
      group: groupCode || "Tanpa Kelompok",
      challengeAnswers: challengeAnswers,
      factAnswers: studentFactAnswers,
      reflections: aiReflections,
      score: calculateScore(studentFactAnswers),
      status: 'active',
      currentRoomId: selectedRoom.id,
      ...updatedData
    };

    setStudentsData(prev => {
      const exists = prev.find(s => s.id === newData.id && s.currentRoomId === selectedRoom.id);
      if (exists) return prev.map(s => (s.id === newData.id && s.currentRoomId === selectedRoom.id) ? newData : s);
      return [...prev, newData];
    });
  }, [userProfile, groupCode, challengeAnswers, studentFactAnswers, aiReflections, selectedRoom]);

  const handleDeleteRoom = (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus kelas ini?")) {
      setRooms(prev => prev.filter(r => r.id !== id));
      if (selectedRoomId === id) {
        setSelectedRoomId(null);
        setView('dashboard');
      }
    }
  };

  const handleCreateRoom = () => {
    const newRoom: Room = { 
      id: `room-${Date.now()}`, 
      name: "Ruang Baru", 
      code: Math.random().toString(36).substring(2, 7).toUpperCase(), 
      matkul: "Bidang Ilmu", 
      challenges: [{
        id: `ch-${Date.now()}`,
        title: "Masalah Utama",
        problem: "Tuliskan skenario masalah di sini...",
        workspaceFields: [{id: `f-${Date.now()}`, label: 'Analisis Awal'}]
      }],
      questions: [] 
    };
    setRooms(prev => [...prev, newRoom]);
  };

  const updateRoomState = (updates: Partial<Room>) => {
    if (!selectedRoomId) return;
    setRooms(prev => prev.map(r => r.id === selectedRoomId ? { ...r, ...updates } : r));
  };

  const handleJoinClass = () => {
    const found = rooms.find(r => r.code === roomCodeInput);
    if(found && userProfile) {
      const isJoined = userProfile.joinedRooms?.includes(found.code);
      if (isJoined) return alert("Anda sudah berada di kelas ini.");
      const updatedProfile = { ...userProfile, joinedRooms: [...(userProfile.joinedRooms || []), found.code] };
      setUserProfile(updatedProfile);
      setUsers(prev => prev.map(u => u.nama === userProfile.nama ? updatedProfile : u));
      setRoomCodeInput("");
      alert(`Berhasil masuk ke ${found.name}`);
    } else {
      alert("Kode kelas tidak valid.");
    }
  };

  const enterRoom = async (room: Room) => {
    setSelectedRoomId(room.id);
    setActiveChallengeId(null);
    setAiResponse("");
    const studentData = studentsData.find(s => s.id === userProfile?.nama && s.currentRoomId === room.id);
    if (studentData) {
      setChallengeAnswers(studentData.challengeAnswers || {});
      setStudentFactAnswers(studentData.factAnswers || []);
      setAiReflections(studentData.reflections || []);
      setGroupCode(studentData.group || "");
    } else {
      setChallengeAnswers({});
      setStudentFactAnswers([]);
      setAiReflections([]);
      setGroupCode("");
    }
    setShowWelcome(true);
    const msg = await generateWelcomeSafetyMessage(userProfile?.nama || "Pelajar", room.matkul);
    setWelcomeMessage(msg);
  };

  const getGroupStats = () => {
    const stats: Record<string, { total: number, count: number }> = {};
    studentsData.filter(s => s.currentRoomId === selectedRoomId).forEach(s => {
      const g = s.group || "Tanpa Kelompok";
      if (!stats[g]) stats[g] = { total: 0, count: 0 };
      stats[g].total += s.score || 0;
      stats[g].count += 1;
    });
    return stats;
  };

  const getPerformanceTag = (avg: number) => {
    const tier = tiers.find(t => avg >= t.min && avg <= t.max);
    if (tier) return tier;
    return { label: "UNSET", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-100" };
  };

  // --- COMPONENT: FACT TEST ---
  const FactTestRunner = () => {
    const [qIdx, setQIdx] = useState(0);
    const [currentSelection, setCurrentSelection] = useState("");
    const [isReflecting, setIsReflecting] = useState(false);
    const [reflectionPrompt, setReflectionPrompt] = useState("");
    const [reflectionText, setReflectionText] = useState("");
    const [isFinished, setIsFinished] = useState(false);
    
    const questions = selectedRoom?.questions || [];
    const currentQ = questions[qIdx];

    // Reset current selection when index changes (for isian)
    useEffect(() => {
      if (currentQ) {
        setCurrentSelection(studentFactAnswers[qIdx] || "");
      }
    }, [qIdx, currentQ]);

    const handleProceed = async () => {
      const updatedAnswers = [...studentFactAnswers];
      updatedAnswers[qIdx] = currentSelection;
      setStudentFactAnswers(updatedAnswers);
      
      if (qIdx < questions.length - 1) {
        setQIdx(prev => prev + 1);
        setCurrentSelection(""); 
      } else {
        // This was the last question, proceed to reflection flow after submit
        setIsReflecting(true);
        const correctCount = updatedAnswers.filter((a, i) => a && questions[i] && a.trim().toLowerCase() === questions[i].correct.trim().toLowerCase()).length;
        const score = Math.round((correctCount / questions.length) * 100);
        const prompt = await generatePostTestReflectionPrompt(score);
        setReflectionPrompt(prompt);
      }
    };

    const submitFinalProcess = () => {
      if (!reflectionText.trim()) return alert("Tuliskan sedikit refleksimu.");
      const updatedReflections = [...aiReflections, reflectionText];
      setAiReflections(updatedReflections);
      syncToTeacher({ reflections: updatedReflections, factAnswers: studentFactAnswers });
      setIsFinished(true);
    };

    if (isFinished) {
      return (
        <div className="fixed inset-0 bg-indigo-900/95 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 text-center shadow-2xl animate-in zoom-in-95">
            <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" />
            <h3 className="text-3xl font-black text-slate-800 mb-2">Proses Selesai</h3>
            <p className="text-slate-500 font-bold mb-8">Refleksimu telah tersimpan secara privat.</p>
            <button onClick={() => { setShowFactTestModal(false); setView('dashboard'); }} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
              <Home size={20}/> Kembali ke Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (isReflecting) {
      return (
        <div className="fixed inset-0 bg-indigo-900/95 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-8">
              <History className="text-amber-500 mx-auto mb-4" size={40} />
              <h3 className="text-2xl font-black text-slate-800">Refleksi Kognitif</h3>
            </div>
            <div className="bg-indigo-50 p-6 rounded-3xl border-l-8 border-indigo-600 mb-8 italic text-indigo-900 font-bold">"{reflectionPrompt || "Menyiapkan refleksi..."}"</div>
            <textarea 
              value={reflectionText} onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Bagikan apa yang kamu yakini saat ini..."
              className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-500 min-h-[140px] font-bold text-slate-800"
            />
            <button onClick={submitFinalProcess} className="w-full mt-6 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all">Simpan Jejak Berpikir</button>
          </div>
        </div>
      );
    }

    if (!currentQ) return (
      <div className="fixed inset-0 bg-slate-900/90 z-[500] flex items-center justify-center text-white font-black flex-col gap-6">
        <Target size={64} className="text-indigo-400" />
        BELUM ADA INSTRUMEN FACT TEST
        <button onClick={() => setShowFactTestModal(false)} className="px-8 py-3 bg-white text-slate-900 rounded-xl">Tutup</button>
      </div>
    );

    const isLastQuestion = qIdx === questions.length - 1;

    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[500] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-10">
            <span className="text-xs font-black text-slate-300 uppercase">Soal {qIdx + 1} dari {questions.length}</span>
            <button onClick={() => setShowFactTestModal(false)} className="text-slate-300 hover:text-red-500 transition-all"><X size={28}/></button>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full mb-10 overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500" style={{width: `${((qIdx + 1) / questions.length) * 100}%`}}></div>
          </div>
          <h3 className="text-2xl font-black text-slate-800 leading-tight mb-10">{currentQ.text}</h3>
          
          <div className="space-y-4 mb-10">
            {currentQ.type === 'pg' && currentQ.options?.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentSelection(opt)} 
                className={`w-full p-6 border-2 rounded-2xl text-left font-black transition-all group active:scale-95 flex items-center justify-between ${currentSelection === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'bg-slate-50 border-slate-50 hover:border-indigo-600 hover:bg-indigo-50'}`}
              >
                <span>{opt}</span>
                {currentSelection === opt && <CheckCircle2 className="text-indigo-600" size={20} />}
              </button>
            ))}
            {currentQ.type === 'boolean' && (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setCurrentSelection('Benar')} 
                  className={`py-10 rounded-3xl font-black text-xl transition-all shadow-md active:scale-95 border-2 ${currentSelection === 'Benar' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}
                >
                  BENAR
                </button>
                <button 
                  onClick={() => setCurrentSelection('Salah')} 
                  className={`py-10 rounded-3xl font-black text-xl transition-all shadow-md active:scale-95 border-2 ${currentSelection === 'Salah' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-100'}`}
                >
                  SALAH
                </button>
              </div>
            )}
            {currentQ.type === 'isian' && (
              <div className="space-y-4">
                <input 
                  autoFocus 
                  value={currentSelection} 
                  onChange={(e) => setCurrentSelection(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && currentSelection.trim() && handleProceed()} 
                  placeholder="Ketik jawaban..." 
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-indigo-500 text-xl" 
                />
              </div>
            )}
          </div>

          {/* NEXT / SUBMIT BUTTON */}
          <button 
            disabled={!currentSelection.trim() && currentQ.type === 'isian'} 
            onClick={handleProceed} 
            className={`w-full py-5 rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 ${!currentSelection && currentQ.type !== 'isian' ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {isLastQuestion ? (
              <><Check size={20}/> Submit Jawaban</>
            ) : (
              <><ArrowRight size={20}/> Next Question</>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-[3.5rem] shadow-2xl p-12 border border-white animate-in zoom-in-95">
          <div className="text-center mb-12">
            <div className="inline-block bg-indigo-600 p-6 rounded-[2rem] mb-6 shadow-2xl shadow-indigo-200"><Brain className="text-white" size={40} /></div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Interanxy</h1>
            <p className="text-slate-400 mt-3 font-bold italic text-[10px] uppercase tracking-[0.4em]">Cognitive Support</p>
          </div>
          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <input name="nama" type="text" placeholder="Username" className="w-full p-5 bg-white border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold shadow-sm" />
              <input name="pass" type="password" placeholder="Password" className="w-full p-5 bg-white border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold shadow-sm" />
              <button type="submit" className="w-full bg-indigo-600 text-white p-6 rounded-2xl font-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">MASUK</button>
              <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-slate-400 text-xs font-black uppercase tracking-widest py-2">Daftar Akun Baru</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <input name="nama" placeholder="Nama Lengkap" className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-bold" />
              <input name="pass" type="password" placeholder="Password Baru" className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-bold" />
              <select name="role" className="w-full p-5 bg-white border border-slate-100 rounded-2xl font-black appearance-none outline-none"><option value="mahasiswa">Mahasiswa</option><option value="dosen">Dosen</option></select>
              <button type="submit" className="w-full bg-slate-900 text-white p-6 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">BUAT AKUN</button>
              <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-slate-400 text-xs font-black uppercase py-2">Sudah ada akun? Masuk</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-[100]">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100"><Brain className="text-white" size={24} /></div>
          <span className="font-black text-2xl tracking-tighter uppercase text-slate-900">Interanxy</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SESI AKTIF</div>
            <div className="text-sm font-black text-indigo-600 uppercase leading-none">{userProfile?.nama} • {userProfile?.role}</div>
          </div>
          <button onClick={() => { setUserProfile(null); setView('login'); setSelectedRoomId(null); }} className="p-4 bg-slate-50 rounded-2xl