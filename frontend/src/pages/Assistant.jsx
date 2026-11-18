import { useState } from 'react';
import { Bot, Send, UserRound, Sparkles } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/misc';

const SUGGESTIONS=['How much revenue did we make this month?','What orders are active?','Which items are selling best?','Compare my branches'];
export default function Assistant(){
  const {role}=useAuth();
  const [messages,setMessages]=useState([{from:'assistant',text:'Hi! I can answer questions using saved FranchiseOps data available to your account. Try asking about revenue, orders, popular items, or branch performance.'}]);
  const [question,setQuestion]=useState(''); const [busy,setBusy]=useState(false);
  const ask=async(text=question)=>{const q=text.trim();if(!q||busy)return;setMessages(m=>[...m,{from:'user',text:q}]);setQuestion('');setBusy(true);try{const r=await api('/assistant/ask',{method:'POST',body:JSON.stringify({question:q})});setMessages(m=>[...m,{from:'assistant',text:r.answer}])}catch(e){setMessages(m=>[...m,{from:'assistant',text:`I couldn't reach the data service: ${e.message}. Check that the backend is running and try again.`}])}finally{setBusy(false)}};
  return <>
    <PageHeader title="AI Assistant" subtitle={`Ask about saved operations data · access limited to ${role.label.toLowerCase()} permissions`} />
    <div className="mx-auto flex min-h-[65vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 p-4"><div className="rounded-xl bg-brand-50 p-2 text-brand-700"><Sparkles size={20}/></div><div><h2 className="font-semibold">FranchiseOps Assistant</h2><p className="text-xs text-slate-500">Answers from your authorized database records</p></div></div>
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-4 sm:p-6" aria-live="polite">
        {messages.map((m,i)=><div key={i} className={`flex gap-3 ${m.from==='user'?'justify-end':''}`}><div className={`flex max-w-[85%] gap-3 ${m.from==='user'?'flex-row-reverse':''}`}><div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.from==='user'?'bg-slate-200 text-slate-700':'bg-brand-100 text-brand-700'}`}>{m.from==='user'?<UserRound size={16}/>:<Bot size={17}/>}</div><div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.from==='user'?'bg-brand-600 text-white':'border border-slate-200 bg-white text-slate-800'}`}>{m.text}</div></div></div>)}
        {busy&&<p className="pl-11 text-xs text-slate-500">Checking authorized records…</p>}
        {messages.length===1&&<div className="flex flex-wrap gap-2 pl-11">{SUGGESTIONS.map(s=><button key={s} onClick={()=>ask(s)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700">{s}</button>)}</div>}
      </div>
      <form className="flex gap-2 border-t border-slate-100 bg-white p-3 sm:p-4" onSubmit={e=>{e.preventDefault();ask()}}><input className="input flex-1" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about your franchise data…" maxLength={500} disabled={busy}/><button className="btn-primary" disabled={busy||!question.trim()} aria-label="Send question"><Send size={16}/><span className="hidden sm:inline">Ask</span></button></form>
    </div>
    <p className="mx-auto mt-3 max-w-4xl text-xs text-slate-400">The assistant reports saved order, menu, branch, and rating data. It does not make changes or provide inventory or staffing insights until those modules are connected.</p>
  </>;
}
