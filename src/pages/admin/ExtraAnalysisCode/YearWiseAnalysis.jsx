import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { 
  Users, CheckCircle, TrendingUp, Upload, 
  DollarSign, Briefcase, Award, Trash2, Database, FileText, X, AlertCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  writeBatch, 
  doc, 
  getDocs, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCF3tVnsRjeTQXDUSVlivKAtmvQ4qZcHcg",
  authDomain: "planning-with-anaiysis.firebaseapp.com",
  projectId: "planning-with-anaiysis",
  storageBucket: "planning-with-anaiysis.firebasestorage.app",
  messagingSenderId: "423072295050",
  appId: "1:423072295050:web:eaee2a34df590379ebe573"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'planning-with-anaiysis';

// --- CONSOLIDATED SERVICE LOGIC ---
const firebaseService = {
  getHistoricalRef: () => collection(db, 'artifacts', appId, 'public', 'data', 'historical_placements'),

  bulkUploadPlacements: async (dataArray, userId) => {
    if (!userId) return;
    const batch = writeBatch(db);
    const colRef = firebaseService.getHistoricalRef();
    
    dataArray.forEach((item) => {
      const docRef = doc(colRef);
      batch.set(docRef, {
        ...item,
        year: Number(item.year),
        package: Number(item.package),
        status: item.status || 'Placed',
        timestamp: serverTimestamp(),
        uploadedBy: userId
      });
    });
    return await batch.commit();
  },

  clearAllHistoricalData: async () => {
    const colRef = firebaseService.getHistoricalRef();
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    return await batch.commit();
  }
};

// --- HELPER: CSV PARSER ---
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i];
    });
    return obj;
  });
};

// --- UI COMPONENTS ---
const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center transition-all hover:border-blue-500/50 group">
    <div className={`p-3 rounded-lg mb-3 ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{label}</div>
  </div>
);

export default function YearWiseAnalysis() {
  const [user, setUser] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(firebaseService.getHistoricalRef(), 
      (snapshot) => {
        setHistoricalData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => { setLoading(false); }
    );
    return () => unsub();
  }, [user]);

  const filteredData = useMemo(() => 
    selectedYear === 'All' ? historicalData : historicalData.filter(s => s.year.toString() === selectedYear)
  , [historicalData, selectedYear]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const placed = filteredData.filter(s => s.status === 'Placed').length;
    const rate = total > 0 ? ((placed / total) * 100).toFixed(1) : 0;
    const avgPkg = total > 0 ? (filteredData.reduce((acc, curr) => acc + (Number(curr.package) || 0), 0) / total).toFixed(2) : 0;
    const topPkg = filteredData.length > 0 ? Math.max(...filteredData.map(s => Number(s.package) || 0)) : 0;
    return { total, placed, rate, avgPkg, topPkg, companies: new Set(filteredData.map(s => s.company)).size };
  }, [filteredData]);

  const yearTrends = useMemo(() => {
    const years = [...new Set(historicalData.map(s => s.year))].sort();
    return years.map(yr => {
      const yrData = historicalData.filter(s => s.year === yr);
      const rate = yrData.length > 0 ? (yrData.filter(s => s.status === 'Placed').length / yrData.length) * 100 : 0;
      return { year: yr, rate: Math.round(rate) };
    });
  }, [historicalData]);

  const branchData = useMemo(() => {
    const branches = [...new Set(filteredData.map(s => s.branch))];
    return branches.map(b => ({
      name: b,
      count: filteredData.filter(s => s.branch === b).length
    }));
  }, [filteredData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setUploadFile(file);
    } else {
      alert("Please upload a valid CSV file.");
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const data = parseCSV(text);
      if (data.length > 0) {
        try {
          await firebaseService.bulkUploadPlacements(data, user.uid);
          setUploadFile(null);
          setIsUploadOpen(false);
        } catch (err) {
          alert("Error uploading data. Check CSV headers.");
        }
      } else {
        alert("CSV is empty or malformed.");
      }
      setIsUploading(false);
    };
    reader.readAsText(uploadFile);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center text-blue-500 font-mono text-sm tracking-widest animate-pulse">
      INITIALIZING_ANALYSIS_ENGINE...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        
        <div className="flex items-center gap-3 flex-wrap">
          <select 
            className="bg-[#0f172a] border border-slate-700 text-sm rounded-lg p-2.5 px-4 outline-none hover:border-blue-500 transition-all cursor-pointer"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="All">Select Graduation Year</option>
            {[...new Set(historicalData.map(s => s.year))].sort().reverse().map(yr => (
              <option key={yr} value={yr}>{yr} Session</option>
            ))}
          </select>

          <button 
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg"
          >
            <FileText className="w-4 h-4" /> CSV Bulk Upload
          </button>

          <button 
            onClick={firebaseService.clearAllHistoricalData}
            className="p-2.5 bg-red-900/10 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-900/20 transition-all"
            title="Clear Historical Data"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon={Users} label="Total Intake" value={stats.total} colorClass="bg-blue-500" />
        <StatCard icon={CheckCircle} label="Placed" value={stats.placed} colorClass="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Placement %" value={`${stats.rate}%`} colorClass="bg-purple-500" />
        <StatCard icon={DollarSign} label="Avg Package" value={`${stats.avgPkg} LPA`} colorClass="bg-amber-500" />
        <StatCard icon={Award} label="Top Package" value={`${stats.topPkg} LPA`} colorClass="bg-rose-500" />
        <StatCard icon={Briefcase} label="Companies" value={stats.companies} colorClass="bg-indigo-500" />
      </div>

      {/* Analysis Visualization */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
            <TrendingUp className="text-blue-400 w-5 h-5" /> Year Wise Trend
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Area type="linear" dataKey="rate" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.1} dot={{ r: 5, fill: '#3b82f6', stroke: '#020617', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
            <Database className="text-emerald-400 w-5 h-5" /> Branch Wise Performance
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} tickLine={false} />
                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#466fce', border: 'none', borderRadius: '10px'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                  {branchData.map((e, i) => (
                    <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CSV Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Upload className="text-blue-500" /> Bulk CSV Import
              </h2>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-10 text-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center gap-4 ${
                  uploadFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${uploadFile ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                  {uploadFile ? <CheckCircle className="text-emerald-500 w-8 h-8" /> : <FileText className="text-blue-500 w-8 h-8" />}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {uploadFile ? uploadFile.name : 'Select Placement CSV'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Drag and drop or click to browse
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleFileChange} 
                />
              </div>

              <div className="mt-8 bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <AlertCircle className="w-3 h-3 text-amber-500" /> Required Columns
                </div>
                <p className="text-xs text-slate-500 font-mono italic">
                  year, branch, package, status, company
                </p>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setIsUploadOpen(false)} 
                  className="flex-1 py-3 text-slate-400 font-semibold hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!uploadFile || isUploading}
                  onClick={handleUploadSubmit} 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? 'Processing...' : 'Upload & Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}