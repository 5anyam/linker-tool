'use client';
import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    campId: '',
    offerLink: '',
    safeLink: '',
    baseDomain: 'style.shuttlewithme.com', // Default Base
    redirectDomain: 'blog.iamaphilokalist.com', // Default Redirect Source
    countries: 'US, GB, CA, IN'
  });
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);

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
        // Link Generation Logic
        // Agar localhost hai toh localhost dikhaye, warn selected Base Domain
        const isLocal = window.location.hostname === 'localhost';
        const domain = isLocal ? window.location.origin : `https://${formData.baseDomain}`;
        
        setGeneratedLink(`${domain}/?${formData.campId}?[sub_id]?[click_id]`);
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
    <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Header */}
        <div className="bg-blue-600 p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🚀 Pro Link Cloaker <span className="text-xs bg-blue-500 px-2 py-1 rounded">v2.0</span>
          </h1>
          <p className="text-blue-100 text-sm mt-1">Double Redirection & Referrer Hiding System</p>
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, campId: e.target.value})}
                />
              </div>

              {/* Base Domain (Selection) */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Base Domain (Ad Link)</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, baseDomain: e.target.value})}
                  value={formData.baseDomain}
                >
                  <option value="style.shuttlewithme.com">style.shuttlewithme.com</option>
                  <option value="travel.thesiswriting.com">travel.thesiswriting.com</option>
                  <option value="localhost:3000">localhost:3000 (Testing)</option>
                </select>
              </div>
            </div>

            {/* Offer Link */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Money Page (Affiliate Link)</label>
              <input 
                type="url" 
                required
                placeholder="https://awin1.com/...?clickref={sub_id}"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                onChange={(e) => setFormData({...formData, offerLink: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1">Vars: <code className="text-yellow-500">{'{sub_id}'}</code>, <code className="text-yellow-500">{'{click_id}'}</code></p>
            </div>

            {/* Redirect Domain (Where go.php is hosted) */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-1">Redirect Domain (Middleman)</label>
              <div className="flex gap-2">
                 <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={(e) => setFormData({...formData, redirectDomain: e.target.value})}
                  value={formData.redirectDomain}
                >
                  <option value="blog.iamaphilokalist.com">blog.iamaphilokalist.com</option>
                  <option value="blog.clubmytrip.com">blog.clubmytrip.com</option>
                  {/* Aap yahan manually bhi type karne ka option de sakte hain */}
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-1">Ensure <code>go.php</code> is uploaded on this domain.</p>
            </div>

            {/* Safe Link */}
             <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Safe Page (White Page)</label>
              <input 
                type="url" 
                required
                placeholder="https://style.shuttlewithme.com/blog..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, safeLink: e.target.value})}
              />
            </div>

            <button 
              disabled={loading}
              className={`w-full py-4 rounded-lg font-bold text-white text-lg transition transform active:scale-95 ${loading ? 'bg-slate-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg'}`}
            >
              {loading ? 'Saving to Redis...' : 'Create Cloaked Link'}
            </button>
          </form>

          {/* Generated Link Box */}
          {generatedLink && (
            <div className="mt-8 bg-black/40 p-6 rounded-xl border border-green-500/30 backdrop-blur-sm animation-fade-in">
              <label className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 block">Your Cloaked Link</label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <code className="flex-1 block w-full text-sm text-slate-300 break-all bg-black/50 p-3 rounded border border-slate-700 font-mono">
                  {generatedLink}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert('Copied!');
                  }}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-medium transition"
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
