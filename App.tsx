
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
  X,
  Map as MapIcon,
  Calendar
} from 'lucide-react';
import { ChatMessage, Spot } from './types';
import { getTravelAdvice } from './services/geminiService';
import InteractiveMap from './components/InteractiveMap';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Sugeng Rawuh! Saya Sugeng, guide lokal kamu. Mau jalan-jalan ke mana di Jogja hari ini? Kamu bisa tanya tempat makan enak, wisata sejarah, atau spot sunset!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedSpots, setSavedSpots] = useState<Spot[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [ratingSpot, setRatingSpot] = useState<Spot | null>(null);
  const [tempRating, setTempRating] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // Real-time location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation permission denied.", err)
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
        const existingNames = new Set(prev.map(s => s.name.toLowerCase()));
        const filtered = response.newSpots!.filter(s => !existingNames.has(s.name.toLowerCase()));
        return [...prev, ...filtered];
      });
    }
    
    setIsLoading(false);
  };

  const openRatingDialog = (spot: Spot) => {
    if (spot.isCompleted) return; 
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
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 z-50 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-black tracking-tight leading-none">JogjaNavigator</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">AI Tourism Companion</span>
              {userLocation && <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <Calendar className="w-3 h-3" />
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 text-sm font-bold text-black hover:bg-black hover:text-white transition-all active:scale-95 shadow-sm">
            <LogIn className="w-4 h-4" />
            Login
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Enhanced Chat Panel */}
        <aside className="w-[400px] border-r border-gray-100 flex flex-col bg-white">
          <div className="p-6 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sugeng Online</h2>
            </div>
            {userLocation && (
              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                LOC: {userLocation.lat.toFixed(2)}, {userLocation.lng.toFixed(2)}
              </span>
            )}
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#FAFAFA]">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-chat`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-black text-white font-medium rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {m.text}
                </div>
                {m.role === 'model' && m.suggestions && m.suggestions.length > 0 && i === messages.length - 1 && (
                  <div className="flex flex-wrap gap-2 mt-4 ml-1">
                    {m.suggestions.map((s, si) => (
                      <button 
                        key={si}
                        onClick={() => handleSendMessage(s)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-600 hover:border-black hover:text-black hover:shadow-md transition-all active:scale-95"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 p-4 items-center bg-white rounded-2xl border border-gray-100 max-w-fit shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-duration:0.6s]" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:0.6s]" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:0.6s]" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sugeng is typing...</span>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="relative group">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Suggest 3 dinner spots near me..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-black placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white transition-all"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={isLoading}
                className="absolute right-2 top-2 w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all shadow-lg active:scale-90 disabled:opacity-30"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Center: Leaflet Map */}
        <main className="flex-1 relative bg-gray-100">
          <InteractiveMap spots={savedSpots} />
          
          <div className="absolute top-8 left-8 z-[400] bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-white/50 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.1em] leading-none">Map View</p>
              <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Yogyakarta Region</p>
            </div>
          </div>
        </main>

        {/* Right: Checklist & Locations */}
        <aside className="w-[340px] border-l border-gray-100 flex flex-col bg-[#FDFDFD]">
          <div className="p-6 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[11px] font-black text-black uppercase tracking-[0.2em]">Trip Bucket</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-black text-white px-2.5 py-1 rounded-full tabular-nums shadow-sm">
                  {savedSpots.filter(s => s.isCompleted).length}/{savedSpots.length}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Rate spots to cross them off your list.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {savedSpots.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-[30%] flex items-center justify-center border border-dashed border-gray-200">
                  <MapPin className="w-10 h-10 text-gray-200" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No spots saved</p>
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">Tell Sugeng what you're looking for!</p>
                </div>
              </div>
            ) : (
              savedSpots.map((spot) => (
                <div 
                  key={spot.id} 
                  className={`group relative bg-white rounded-2xl p-5 border transition-all duration-300 hover:shadow-xl ${
                    spot.isCompleted ? 'border-gray-100 bg-gray-50/50' : 'border-white shadow-sm hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={() => openRatingDialog(spot)}
                      disabled={spot.isCompleted}
                      className={`mt-1 flex-shrink-0 transition-all ${
                        spot.isCompleted 
                        ? 'text-emerald-500' 
                        : 'text-gray-200 hover:text-black hover:scale-125'
                      }`}
                    >
                      {spot.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-[13px] font-extrabold truncate leading-tight ${spot.isCompleted ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
                          {spot.name}
                        </h3>
                        <button 
                          onClick={() => removeSpot(spot.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-500 transition-all p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tight line-clamp-1">
                        {spot.address}
                      </p>
                      
                      {spot.isCompleted && spot.rating && (
                        <div className="flex gap-0.5 mt-3">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < spot.rating! ? 'text-black fill-current' : 'text-gray-100'}`} 
                            />
                          ))}
                        </div>
                      )}
                      
                      {!spot.isCompleted && (
                        <div className="flex items-center gap-2 mt-4">
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                             <Clock className="w-2.5 h-2.5 text-gray-400" />
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{spot.time || 'VISIT'}</span>
                          </div>
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

      {/* Aesthetic Rating Dialog */}
      {ratingSpot && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-white transform transition-all scale-in-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-black tracking-tight">How was it?</h3>
                <p className="text-sm text-gray-400 font-medium mt-1 leading-relaxed">Share your rating for {ratingSpot.name}</p>
              </div>
              <button 
                onClick={() => setRatingSpot(null)} 
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex justify-between gap-2 py-8 mb-8 border-y border-gray-50">
              {[1, 2, 3, 4, 5].map((num) => (
                <button 
                  key={num}
                  onMouseEnter={() => setTempRating(num)}
                  onClick={() => setTempRating(num)}
                  className="group relative flex flex-col items-center gap-2"
                >
                  <Star 
                    className={`w-12 h-12 transition-all duration-300 transform ${
                      num <= tempRating 
                        ? 'text-black fill-current scale-110' 
                        : 'text-gray-100 group-hover:text-gray-200'
                    }`}
                  />
                  <span className={`text-[10px] font-black transition-opacity ${num === tempRating ? 'opacity-100' : 'opacity-0'}`}>
                    {num}
                  </span>
                </button>
              ))}
            </div>

            <button 
              onClick={submitRating}
              disabled={tempRating === 0}
              className="w-full bg-black text-white py-5 rounded-3xl font-black text-sm uppercase tracking-[0.25em] hover:bg-gray-800 transition-all disabled:opacity-10 shadow-xl shadow-black/10 active:scale-95"
            >
              Complete Visit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
