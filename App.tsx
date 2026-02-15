
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MapPin, 
  CheckCircle2, 
  Circle,
  Clock,
  Navigation,
  LogIn,
  Trash2,
  Star,
  X
} from 'lucide-react';
import { ChatMessage, Spot } from './types';
import { getTravelAdvice } from './services/geminiService';
import InteractiveMap from './components/InteractiveMap';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Sugeng Rawuh! Saya Sugeng, guide lokal kamu. Mau jalan-jalan ke mana di Jogja hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedSpots, setSavedSpots] = useState<Spot[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [ratingSpot, setRatingSpot] = useState<Spot | null>(null);
  const [tempRating, setTempRating] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation blocked or failed", err)
      );
    }
  }, []);

  const handleSendMessage = async (textOverride?: string) => {
    const textToUse = textOverride || input;
    if (!textToUse.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: textToUse }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await getTravelAdvice(textToUse, history, userLocation);
    
    setMessages([...newMessages, { 
      role: 'model', 
      text: response.text, 
      suggestions: response.suggestions 
    }]);
    
    if (response.newSpots) {
      setSavedSpots(prev => {
        const existingNames = new Set(prev.map(s => s.name));
        const filtered = response.newSpots!.filter(s => !existingNames.has(s.name));
        return [...prev, ...filtered];
      });
    }
    
    setIsLoading(false);
  };

  const openRatingDialog = (spot: Spot) => {
    if (spot.isCompleted) return; // Already rated
    setRatingSpot(spot);
    setTempRating(0);
  };

  const submitRating = () => {
    if (!ratingSpot || tempRating === 0) return;
    
    setSavedSpots(prev => prev.map(s => 
      s.id === ratingSpot.id ? { ...s, isCompleted: true, rating: tempRating } : s
    ));
    setRatingSpot(null);
  };

  const removeSpot = (id: string) => {
    setSavedSpots(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Navbar */}
      <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 z-50 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
            <Navigation className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-black tracking-tight leading-none">JogjaNavigator</h1>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Real-time Guide</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 text-sm font-bold text-black hover:bg-gray-50 transition-all">
          <LogIn className="w-4 h-4" />
          Login
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Panel */}
        <aside className="w-[380px] border-r border-gray-100 flex flex-col bg-white">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Conversation</h2>
            {userLocation && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-600">GPS ACTIVE</span>
              </div>
            )}
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-[#FDFDFD]">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[88%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-black text-white font-medium rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {m.text}
                </div>
                {m.role === 'model' && m.suggestions && m.suggestions.length > 0 && i === messages.length - 1 && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-2">
                    {m.suggestions.map((s, si) => (
                      <button 
                        key={si}
                        onClick={() => handleSendMessage(s)}
                        className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-1.5 p-4 items-center text-gray-400 bg-white rounded-2xl border border-gray-50 max-w-fit shadow-sm">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="text-[10px] font-bold ml-2 text-black uppercase tracking-widest">Sugeng is thinking...</span>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-gray-100 bg-white">
            <div className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="What location? What time? Ask anything..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-5 pr-14 text-sm font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all shadow-inner"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={isLoading}
                className="absolute right-2 top-2 w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 font-medium text-center mt-3 tracking-wide">
              AI suggests 3 locations per request based on your vibe.
            </p>
          </div>
        </aside>

        {/* Center: Interactive Map */}
        <main className="flex-1 relative bg-gray-100">
          <InteractiveMap spots={savedSpots} />
          
          <div className="absolute top-6 left-6 z-[400] bg-white px-4 py-2.5 rounded-xl shadow-xl border border-gray-50 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <div className="flex flex-col">
              <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest leading-none">Live Map Data</p>
              <p className="text-[8px] text-gray-400 font-bold mt-0.5">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </main>

        {/* Right: Location List */}
        <aside className="w-[320px] border-l border-gray-100 flex flex-col bg-[#F9FAFB]">
          <div className="p-5 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-black text-black uppercase tracking-tight">Saved Spots</h2>
              <span className="text-[10px] font-black bg-black text-white px-2.5 py-1 rounded-full">
                {savedSpots.filter(s => s.isCompleted).length}/{savedSpots.length}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rate to complete your journey</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {savedSpots.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                  <MapPin className="w-8 h-8 text-gray-200" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">No destinations</p>
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">Ask Sugeng for 3 spots to get started on your map.</p>
                </div>
              </div>
            ) : (
              savedSpots.map((spot) => (
                <div 
                  key={spot.id} 
                  className={`group bg-white rounded-2xl p-5 border transition-all hover:shadow-xl ${
                    spot.isCompleted ? 'border-gray-100 bg-gray-50/30' : 'border-white shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={() => openRatingDialog(spot)}
                      disabled={spot.isCompleted}
                      className={`mt-1 flex-shrink-0 transition-all ${
                        spot.isCompleted 
                        ? 'text-black' 
                        : 'text-gray-300 hover:text-black hover:scale-110'
                      }`}
                    >
                      {spot.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-[13px] font-bold truncate ${spot.isCompleted ? 'text-gray-400 line-through decoration-black decoration-2' : 'text-black'}`}>
                          {spot.name}
                        </h3>
                        <button 
                          onClick={() => removeSpot(spot.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight line-clamp-1">
                        {spot.address}
                      </p>
                      
                      {spot.isCompleted && spot.rating && (
                        <div className="flex gap-0.5 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < spot.rating! ? 'text-black fill-current' : 'text-gray-200'}`} 
                            />
                          ))}
                        </div>
                      )}
                      
                      {!spot.isCompleted && (
                        <div className="flex items-center gap-2 mt-3 text-gray-300">
                          <Clock className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{spot.time || 'VISIT TODAY'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Rating Dialog Overlay */}
      {ratingSpot && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-in-center border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-black">Rate Your Visit</h3>
                <p className="text-sm text-gray-500 mt-1">{ratingSpot.name}</p>
              </div>
              <button onClick={() => setRatingSpot(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex justify-center gap-3 py-6 mb-6">
              {[1, 2, 3, 4, 5].map((num) => (
                <button 
                  key={num}
                  onMouseEnter={() => setTempRating(num)}
                  onClick={() => setTempRating(num)}
                  className="transition-transform active:scale-90"
                >
                  <Star 
                    className={`w-10 h-10 ${num <= tempRating ? 'text-black fill-current' : 'text-gray-200'} transition-colors`}
                  />
                </button>
              ))}
            </div>

            <button 
              onClick={submitRating}
              disabled={tempRating === 0}
              className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-800 transition-all disabled:opacity-20 shadow-lg shadow-black/10"
            >
              Submit & Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
