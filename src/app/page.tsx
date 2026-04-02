'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    campId: '',
    offerLink: '',
    safeLink: '',
    baseDomain: 'linker-tool.vercel.app', // Default Tool URL
    redirectDomain: 'blog.clubmytrip.com', // Default Middleman
    countries: 'US, GB, CA, IN, AU, DE'
  });
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-detect domain if running locally or on a different Vercel URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        setFormData(prev => ({ ...prev, baseDomain: window.location.hostname }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Construct the final link
        setGeneratedLink(`https://${formData.baseDomain}/?${formData.campId}?[sub_id]?[click_id]`);
      } else {
        alert('Failed to save campaign');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-slate-900 rounded-xl shadow-2xl border border-slate-800">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 rounded-t-xl">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🛡️ Link Cloaker Pro
          </h1>
          <p className="text-indigo-100 text-sm mt-1">Double Redirection & Firewall Bypass System</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campaign ID */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Campaign ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 9074"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  onChange={(e) => setFormData({...formData, campId: e.target.value})}
                />
              </div>

              {/* Base Domain */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Base Domain (Tool URL)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  value={formData.baseDomain}
                  onChange={(e) => setFormData({...formData, baseDomain: e.target.value})}
                />
              </div>
            </div>

            {/* Offer Link */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Money Page (Affiliate Link)</label>
              <input 
                type="url" 
                required
                placeholder="https://awin1.com/...&clickref={sub_id}"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                onChange={(e) => setFormData({...formData, offerLink: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1">
                Vars: <code className="text-yellow-500">{'{sub_id}'}</code>, <code className="text-yellow-500">{'{click_id}'}</code>
              </p>
            </div>

            {/* Redirect Domain (Middleman) */}
           {/* Redirect Domain (Middleman) */}
<div>
  <label className="block text-sm font-medium text-green-400 mb-1">Redirect Domain (Middleman)</label>
  <select
    required
    className="w-full bg-slate-950 border border-green-800/50 rounded-lg p-3 text-white focus:border-green-500 outline-none cursor-pointer"
    value={formData.redirectDomain}
    onChange={(e) => setFormData({...formData, redirectDomain: e.target.value})}
  >
    <option value="blog.clubmytrip.com">blog.clubmytrip.com</option>
    <option value="blog.trendships.com">blog.trendships.com</option>
  </select>
  <p className="text-xs text-slate-500 mt-1">Must have <code>go.php</code> uploaded.</p>
</div>

            {/* Safe Link */}
             <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Safe Page (White Page)</label>
              <input 
                type="url" 
                required
                placeholder="https://style.shuttlewithme.com/blog..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, safeLink: e.target.value})}
              />
            </div>

            <button 
              disabled={loading}
              className={`w-full py-4 rounded-lg font-bold text-white text-lg transition transform active:scale-[0.98] ${loading ? 'bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'}`}
            >
              {loading ? 'Saving...' : '🚀 Create Link'}
            </button>
          </form>

          {/* Generated Link Box */}
          {generatedLink && (
            <div className="mt-8 bg-black/40 p-5 rounded-xl border border-green-500/30">
              <label className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 block">Your Cloaked Link</label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <code className="flex-1 block w-full text-sm text-slate-300 break-all bg-black/50 p-3 rounded border border-slate-700 font-mono">
                  {generatedLink}
                </code>
                <button 
                  onClick={() => {navigator.clipboard.writeText(generatedLink); alert('Copied!');}}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
