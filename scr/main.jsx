import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Music, 
  User, 
  Mic2, 
  Trash2, 
  CheckCircle, 
  Settings, 
  ChevronLeft, 
  Search,
  Users,
  Clock,
  Play,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'karaoke-party-app';

// --- Sub-Components ---

const RequestView = ({ 
  guestName, setGuestName, 
  artist, setArtist, 
  songTitle, setSongTitle, 
  statusMsg, handleSubmitRequest, 
  setView, 
  currentSinging 
}) => (
  <div className="max-w-md mx-auto p-6 space-y-8">
    <header className="text-center space-y-2">
      <div className="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-600 rounded-full mb-2">
        <Mic2 size={32} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Karaoke Night</h1>
      <p className="text-gray-500">Ready for your spotlight? Request a song below.</p>
    </header>

    {currentSinging && (
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg animate-pulse">
        <div className="flex items-center gap-2 mb-1 opacity-80 uppercase tracking-widest text-[10px] font-bold">
          <Play size={12} fill="currentColor" /> Now Singing
        </div>
        <div className="font-bold text-lg leading-tight">{currentSinging.songTitle}</div>
        <div className="text-sm opacity-90">{currentSinging.artist} — {currentSinging.guestName}</div>
      </div>
    )}

    <form onSubmit={handleSubmitRequest} className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
        <div className="relative">
          <User className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            required
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            placeholder="e.g. John Smith"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Song Title</label>
          <div className="relative">
            <Music className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="e.g. Bohemian Rhapsody"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="e.g. Queen"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`p-3 rounded-lg text-sm font-medium text-center ${statusMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {statusMsg.text}
        </div>
      )}

      <button 
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2"
      >
        Send Request <Mic2 size={18} />
      </button>
    </form>

    <div className="text-center">
      <button 
        onClick={() => setView('login')}
        className="text-xs text-gray-400 hover:text-purple-600 flex items-center justify-center gap-1 mx-auto"
      >
        <Settings size={12} /> Admin Login
      </button>
    </div>
  </div>
);

const AdminView = ({ requests, loading, updateStatus, deleteRequest, clearAllRequests, setView }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-purple-600" /> Host Dashboard
          </h1>
          <p className="text-sm text-gray-500">{requests.length} total requests in queue</p>
        </div>
        <div className="flex items-center gap-2">
          {!showConfirm ? (
            <button 
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-100 transition-all"
            >
              <RotateCcw size={16} /> Clear List
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 p-1 px-2 rounded-lg border border-red-200">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                <AlertTriangle size={12} /> Are you sure?
              </span>
              <button 
                onClick={() => { clearAllRequests(); setShowConfirm(false); }}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 font-bold"
              >
                Yes, Clear
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="text-xs bg-white text-gray-600 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
          <button 
            onClick={() => setView('request')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-600 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm transition-all"
          >
            <ChevronLeft size={16} /> Guest Mode
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading queue...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Clock size={48} className="mx-auto opacity-20" />
            <p>The queue is empty. Waiting for singers...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req, idx) => (
              <div 
                key={req.id} 
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${req.status === 'completed' ? 'bg-gray-50 opacity-50' : req.status === 'singing' ? 'bg-purple-50 border-l-4 border-purple-500' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${req.status === 'completed' ? 'bg-gray-200 text-gray-500' : 'bg-purple-100 text-purple-600'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${req.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {req.songTitle}
                    </h3>
                    <p className={`text-sm ${req.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {req.artist} — <span className="font-semibold">{req.guestName}</span>
                    </p>
                    {req.status === 'singing' && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded uppercase">Current</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {req.status === 'pending' && (
                    <button 
                      onClick={() => updateStatus(req.id, 'singing')}
                      className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <Play size={20} /> <span className="sm:hidden">Start</span>
                    </button>
                  )}
                  {req.status === 'singing' && (
                    <button 
                      onClick={() => updateStatus(req.id, 'completed')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <CheckCircle size={20} /> <span className="sm:hidden">Finish</span>
                    </button>
                  )}
                  <button 
                    onClick={() => deleteRequest(req.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    <Trash2 size={20} /> <span className="sm:hidden">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LoginView = ({ handleAdminLogin, adminPass, setAdminPass, statusMsg, setView }) => (
  <div className="max-w-md mx-auto p-6 mt-12">
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
      <div className="text-center space-y-2">
        <Settings className="mx-auto text-gray-400" size={32} />
        <h2 className="text-xl font-bold">Host Login</h2>
        <p className="text-sm text-gray-500">Enter password to access the queue</p>
      </div>
      <form onSubmit={handleAdminLogin} className="space-y-4">
        <input 
          type="password"
          autoFocus
          className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Admin Password"
          value={adminPass}
          onChange={(e) => setAdminPass(e.target.value)}
        />
        {statusMsg.text && (
          <p className="text-red-500 text-xs text-center">{statusMsg.text}</p>
        )}
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => setView('request')}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 transition-all"
          >
            Login
          </button>
        </div>
      </form>
      <p className="text-[10px] text-center text-gray-400">Demo Password: karaoke123</p>
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('request'); 
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminPass, setAdminPass] = useState('');
  
  // Guest Form State
  const [guestName, setGuestName] = useState('');
  const [artist, setArtist] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const requestsCol = collection(db, 'artifacts', appId, 'public', 'data', 'requests');
    const unsubscribe = onSnapshot(requestsCol, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const sorted = data.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeA - timeB;
        });
        
        setRequests(sorted);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!guestName || !artist || !songTitle) return;

    try {
      const requestsCol = collection(db, 'artifacts', appId, 'public', 'data', 'requests');
      await addDoc(requestsCol, {
        guestName,
        artist,
        songTitle,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setGuestName('');
      setArtist('');
      setSongTitle('');
      setStatusMsg({ type: 'success', text: 'Song added to the queue!' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to send request.' });
    }
  };

  const updateStatus = async (id, newStatus) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'requests', id);
    if (newStatus === 'singing') {
      const currentlySinging = requests.find(r => r.status === 'singing');
      if (currentlySinging) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', currentlySinging.id), { status: 'completed' });
      }
    }
    await updateDoc(docRef, { status: newStatus });
  };

  const deleteRequest = async (id) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'requests', id);
    await deleteDoc(docRef);
  };

  const clearAllRequests = async () => {
    const requestsCol = collection(db, 'artifacts', appId, 'public', 'data', 'requests');
    const querySnapshot = await getDocs(requestsCol);
    const deletePromises = querySnapshot.docs.map(docSnap => 
      deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', docSnap.id))
    );
    await Promise.all(deletePromises);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPass === 'karaoke123') {
      setView('admin');
      setAdminPass('');
      setStatusMsg({ type: '', text: '' });
    } else {
      setStatusMsg({ type: 'error', text: 'Incorrect Password' });
    }
  };

  const currentSinging = requests.find(r => r.status === 'singing');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {view === 'request' && (
          <RequestView 
            guestName={guestName} setGuestName={setGuestName}
            artist={artist} setArtist={setArtist}
            songTitle={songTitle} setSongTitle={setSongTitle}
            statusMsg={statusMsg} handleSubmitRequest={handleSubmitRequest}
            setView={setView}
            currentSinging={currentSinging}
          />
        )}
        {view === 'admin' && (
          <AdminView 
            requests={requests} loading={loading}
            updateStatus={updateStatus} deleteRequest={deleteRequest}
            clearAllRequests={clearAllRequests}
            setView={setView}
          />
        )}
        {view === 'login' && (
          <LoginView 
            handleAdminLogin={handleAdminLogin}
            adminPass={adminPass} setAdminPass={setAdminPass}
            statusMsg={statusMsg} setView={setView}
          />
        )}
      </div>
    </div>
  );
}

// Render logic
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}