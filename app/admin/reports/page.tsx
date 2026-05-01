'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import { AdminRoute } from '@/components/AdminRoute'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, FileText, RefreshCw, Sparkles, Settings2 } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'

interface Exercise { id: string; title: string }
interface SeverityContrast { category: string; min: number; max: number; avg: number; spread: number; count: number }
interface ModelComparison { name: string; realName: string; totalFlags: number; avgSeverity: number; topCategory: string; categories: Record<string, number> }
interface Subtotal { category: string; totalFlags: number; avgSeverity: number; perModel: Record<string, number> }
interface OtherItem { description: string; count: number }
interface LanguageFlag { description: string; category: string; severity: number }
interface TopPrompt { prompt: string; severity: number; count: number; category: string; model: string }

interface ReportData {
  totalFlags: number
  severityContrasts: SeverityContrast[]
  modelComparison: ModelComparison[]
  subtotals: Subtotal[]
  otherAnalysis: OtherItem[]
  languageFlags: LanguageFlag[]
  topPrompts: TopPrompt[]
  modelNames: string[]
}

const COLORS = { gold: '#F3D59D', sage: '#B5D3C7', peach: '#FABBA3', blue: '#A8C8E8', red: '#ff6b6b', yellow: '#ffd93d', green: '#6bcb77' }
const MODEL_COLORS = [COLORS.sage, COLORS.peach, COLORS.blue, COLORS.gold]

const categoryLabels: Record<string, string> = {
  harmful_content: 'Harmful Content', misinformation: 'Misinformation', bias_discrimination: 'Bias & Discrimination',
  privacy_violation: 'Privacy Violation', inappropriate_response: 'Inappropriate', factual_error: 'Factual Error',
  off_topic: 'Off Topic', spam: 'Spam', other: 'Other',
}

function severityColor(v: number) {
  if (v >= 8) return COLORS.red
  if (v >= 5) return COLORS.yellow
  return COLORS.green
}

export default function ReportsPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseId, setExerciseId] = useState('')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [summaryModel, setSummaryModel] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [maxWords, setMaxWords] = useState(500)
  const [preferredModel, setPreferredModel] = useState<'auto' | 'claude' | 'groq'>('auto')
  const [includeSections, setIncludeSections] = useState({
    executive: true, severity: true, model: true, language: true, recommendations: true,
  })
  const summaryRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('exercises').select('id, title').order('title').then(({ data }) => setExercises(data || []))
  }, [])

  const fetchReport = useCallback(async () => {
    if (!exerciseId) { setReport(null); return }
    setLoading(true)
    setSummary('')
    const params = exerciseId === 'all' ? '' : `?exercise_id=${exerciseId}`
    const res = await fetch(`/api/admin/reports${params}`)
    const data = await res.json()
    setReport(data)
    setLoading(false)
  }, [exerciseId])

  useEffect(() => { fetchReport() }, [fetchReport])

  const getExerciseContext = () => {
    if (exerciseId === 'all') return { title: 'All Exercises (Combined)', description: `Aggregated data across ${exercises.length} exercises` }
    const ex = exercises.find(e => e.id === exerciseId)
    return ex ? { title: ex.title } : null
  }

  const generateSummary = async () => {
    if (!report) return
    setSummaryLoading(true)
    setSummary('')
    setSummaryModel('')
    try {
      const sections = []
      if (includeSections.executive) sections.push('1. **Executive Summary** — Key findings in 2-3 sentences')
      if (includeSections.severity) sections.push('2. **Severity Analysis** — Which categories show the widest severity contrasts and what this means')
      if (includeSections.model) sections.push('3. **Model Comparison** — How the models differ in safety performance')
      if (includeSections.language) sections.push('4. **Language & Cultural Bias** — Any patterns in language-related flags')
      if (includeSections.recommendations) sections.push('5. **Recommendations** — 3-5 actionable recommendations based on the data')

      const res = await fetch('/api/admin/reports/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData: { ...report, exerciseContext: getExerciseContext() }, maxWords, sections, preferredModel }),
      })
      const data = await res.json()
      setSummary(data.summary || 'Failed to generate summary.')
      setSummaryModel(data.model || '')
      setTimeout(() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch { setSummary('Error generating summary.') }
    setSummaryLoading(false)
  }

  const copySummary = () => {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportSummaryPdf = () => {
    const el = summaryRef.current
    if (!el) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html><head><title>SOMOS Governance Report</title><style>body{font-family:Inter,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#1a1a1a}h1,h2,h3{font-family:'Space Grotesk',sans-serif}h2{border-bottom:2px solid #F3D59D;padding-bottom:8px}strong{color:#333}li{margin-bottom:8px}</style></head><body>`)
    w.document.write(`<h1>SOMOS Governance Report</h1>`)
    w.document.write(el.querySelector('.prose')?.innerHTML || summary)
    w.document.write(`<p style="margin-top:40px;color:#999;font-size:12px">Generated by ${summaryModel || 'AI'} · SOMOS Civic Lab</p>`)
    w.document.write('</body></html>')
    w.document.close()
    w.print()
  }

  // Chart data
  const flagsByCategory = report?.subtotals.map(s => ({
    name: categoryLabels[s.category] || s.category,
    count: s.totalFlags,
  })) || []

  const modelChartData = report?.subtotals.map(s => {
    const row: any = { name: categoryLabels[s.category] || s.category }
    for (const [model, count] of Object.entries(s.perModel)) row[model] = count
    return row
  }) || []

  return (
    <AdminRoute>
      <div className="min-h-screen text-[#e8e1db] relative" style={{ background: '#0b1326', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(243,213,157,0.05) 0%, transparent 50%)' }}>
        {/* Starfield */}
        <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(0.5px 0.5px at 10px 20px, white, transparent), radial-gradient(1px 1px at 50px 70px, rgba(243,213,157,0.4), transparent), radial-gradient(0.8px 0.8px at 120px 150px, white, transparent)', backgroundSize: '200px 200px' }} />
        <style>{`
          .glass-card { background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); transition: box-shadow 0.3s ease; }
          .glass-card:hover { box-shadow: 0 0 20px rgba(243,213,157,0.05); }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
          .report-sections > * { animation: fadeInUp 0.6s ease-out both; }
          .report-sections > *:nth-child(1) { animation-delay: 0s; }
          .report-sections > *:nth-child(2) { animation-delay: 0.08s; }
          .report-sections > *:nth-child(3) { animation-delay: 0.16s; }
          .report-sections > *:nth-child(4) { animation-delay: 0.24s; }
          .report-sections > *:nth-child(5) { animation-delay: 0.32s; }
          .report-sections > *:nth-child(6) { animation-delay: 0.4s; }
          .report-sections > *:nth-child(7) { animation-delay: 0.48s; }
          .report-sections > *:nth-child(8) { animation-delay: 0.56s; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
          .report-sections > * { animation: fadeInUp 0.6s ease-out both; }
        `}</style>
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link></Button>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 flex-1" style={{ fontFamily: 'Space Grotesk' }}>
                <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-[#F3D59D]" /> Governance Report
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select value={exerciseId} onChange={e => setExerciseId(e.target.value)} className="bg-[#171f33] border border-white/10 rounded-lg px-3 py-2 text-sm flex-1 sm:flex-none min-w-0">
                <option value="">Select Exercise...</option>
                <option value="all">All Exercises</option>
                {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading} className="border-white/10">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={generateSummary} disabled={summaryLoading || !report} className="bg-[#F3D59D] text-[#0b1326] hover:bg-[#e0c38c] text-xs sm:text-sm">
                <Sparkles className="h-4 w-4 mr-1" /> {summaryLoading ? 'Generating...' : 'Generate AI Summary'}
              </Button>
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="border-white/10">
                  <Settings2 className="h-4 w-4" />
                </Button>
              {showSettings && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-xl p-4 space-y-4" style={{ background: '#171f33', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Report Settings</span>
                    <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">✕</button>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase block mb-1">Max Words</label>
                    <select value={maxWords} onChange={e => setMaxWords(Number(e.target.value))} className="w-full bg-[#0b1326] border border-white/10 rounded px-2 py-1 text-sm">
                      <option value={250}>Short (~250 words)</option>
                      <option value={500}>Medium (~500 words)</option>
                      <option value={1000}>Long (~1000 words)</option>
                      <option value={2000}>Detailed (~2000 words)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase block mb-1">AI Model</label>
                    <select value={preferredModel} onChange={e => setPreferredModel(e.target.value as any)} className="w-full bg-[#0b1326] border border-white/10 rounded px-2 py-1 text-sm">
                      <option value="auto">Auto (Claude → Groq fallback)</option>
                      <option value="claude">Claude Sonnet</option>
                      <option value="groq">Groq Llama</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase block mb-2">Sections</label>
                    {([
                      ['executive', 'Executive Summary'],
                      ['severity', 'Severity Analysis'],
                      ['model', 'Model Comparison'],
                      ['language', 'Language & Cultural Bias'],
                      ['recommendations', 'Recommendations'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                        <input type="checkbox" checked={includeSections[key]} onChange={() => setIncludeSections(prev => ({ ...prev, [key]: !prev[key] }))} className="rounded" />
                        {label}
                      </label>
                    ))}
                  </div>
                  <Button size="sm" className="w-full" onClick={() => setShowSettings(false)}>Done</Button>
                </div>
              )}
            </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F3D59D]" /></div>
          ) : !report || report.totalFlags === 0 ? (
            <div className="text-center py-20 text-white/50">{!exerciseId ? 'Select an exercise to generate a report.' : 'No flag data available for this exercise.'}</div>
          ) : (
            <div className="space-y-8 report-sections">
              {/* Section 1: Severity Contrasts */}
              <section className="rounded-xl overflow-hidden glass-card">
                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                  <h2 className="text-xl font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Severity Contrasts</h2>
                </div>
                <table className="w-full text-left">
                  <thead><tr className="bg-white/5 text-xs uppercase tracking-wider text-white/50">
                    <th className="px-6 py-3">Category</th><th className="px-6 py-3">Min</th><th className="px-6 py-3">Max</th><th className="px-6 py-3">Avg</th><th className="px-6 py-3">Spread</th><th className="px-6 py-3">Flags</th>
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {report.severityContrasts.map((s, i) => (
                      <tr key={s.category} className={i < 2 ? 'bg-[#F3D59D]/5' : 'hover:bg-white/5'}>
                        <td className="px-6 py-3 font-medium">{categoryLabels[s.category] || s.category}</td>
                        <td className="px-6 py-3" style={{ color: severityColor(s.min), fontFamily: 'Space Grotesk' }}>{s.min}</td>
                        <td className="px-6 py-3" style={{ color: severityColor(s.max), fontFamily: 'Space Grotesk' }}>{s.max}</td>
                        <td className="px-6 py-3 font-bold" style={{ color: severityColor(s.avg), fontFamily: 'Space Grotesk' }}>{s.avg}</td>
                        <td className="px-6 py-3" style={{ fontFamily: 'Space Grotesk' }}>{s.spread}</td>
                        <td className="px-6 py-3" style={{ fontFamily: 'Space Grotesk' }}>{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Section 2: Harm Classification Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="rounded-xl p-6 glass-card">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Flag Count Per Category</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={flagsByCategory} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#998f82', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#d0c5b6', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#171f33', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e1db' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>{flagsByCategory.map((_, i) => <Cell key={i} fill={COLORS.gold} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </section>

                <section className="rounded-xl p-6 glass-card">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Model Comparison by Category</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={modelChartData}>
                      <XAxis dataKey="name" tick={{ fill: '#d0c5b6', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: '#998f82', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#171f33', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e1db' }} />
                      <Legend />
                      {report.modelNames.map((name, i) => (
                        <Bar key={name} dataKey={name} fill={MODEL_COLORS[i % MODEL_COLORS.length]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </section>
              </div>

              {/* Section 3: Other Category Analysis */}
              {report.otherAnalysis.length > 0 && (
                <section className="rounded-xl p-6 glass-card">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>"Other" Category Analysis</h3>
                  <div className="space-y-3">
                    {report.otherAnalysis.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-sm text-white/80">{item.description}</span>
                        <Badge className="bg-[#314c43] text-[#afcdc1] text-xs">{item.count} flags</Badge>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 4: Subtotal Scores */}
              <section className="rounded-xl overflow-hidden glass-card">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Global Metric Subtotals</h3>
                </div>
                <table className="w-full text-left">
                  <thead><tr className="bg-white/5 text-xs uppercase tracking-wider text-white/50">
                    <th className="px-6 py-3">Category</th><th className="px-6 py-3">Total Flags</th><th className="px-6 py-3">Avg Severity</th>
                    {report.modelNames.map(n => <th key={n} className="px-6 py-3 border-l border-white/5">{n} Distribution</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {report.subtotals.map((s, i) => {
                      const total = s.totalFlags || 1
                      return (
                        <tr key={s.category} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                          <td className="px-6 py-3">{categoryLabels[s.category] || s.category}</td>
                          <td className="px-6 py-3" style={{ fontFamily: 'Space Grotesk' }}>{s.totalFlags}</td>
                          <td className="px-6 py-3" style={{ color: severityColor(s.avgSeverity), fontFamily: 'Space Grotesk' }}>{s.avgSeverity}</td>
                          {report.modelNames.map(n => (
                            <td key={n} className="px-6 py-3 border-l border-white/5" style={{ fontFamily: 'Space Grotesk' }}>{Math.round(((s.perModel[n] || 0) / total) * 100)}%</td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </section>

              {/* Section 5: Per-Model Comparison */}
              {(() => {
                const sorted = [...report.modelComparison].sort((a, b) => a.avgSeverity - b.avgSeverity)
                const totalAll = sorted.reduce((s, m) => s + m.totalFlags, 0) || 1
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {sorted.map((m, i) => {
                      const isSafe = i === 0 && sorted.length > 1
                      const isRisky = i === sorted.length - 1 && sorted.length > 1
                      return (
                        <section key={m.name} className="rounded-xl p-6 glass-card">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-xl font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Model {m.name}</h4>
                              {m.realName && <Badge variant="outline" className="text-[10px] border-white/20 mt-1 block w-fit">{m.realName}</Badge>}
                              <div className="mt-2 group relative inline-block">
                                <span className="text-xs uppercase tracking-wide cursor-help" style={{ color: isSafe ? COLORS.sage : isRisky ? COLORS.peach : COLORS.blue }}>
                                  {isSafe ? 'Optimized / Safe' : isRisky ? 'Experimental / High-Risk' : 'Moderate'}
                                </span>
                                <div className="hidden group-hover:block absolute left-0 top-6 z-50 w-56 p-2 rounded-lg text-xs text-white/80 bg-[#171f33] border border-white/15 shadow-lg">
                                  {isSafe ? `Lowest avg severity (${m.avgSeverity}/10) among models` : isRisky ? `Highest avg severity (${m.avgSeverity}/10) among models` : `Avg severity: ${m.avgSeverity}/10`}
                                </div>
                              </div>
                            </div>
                            {isSafe && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.sage} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                            )}
                            {isRisky && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.peach} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-xs text-white/50 uppercase">Total Flags</span><p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{m.totalFlags}</p></div>
                            <div><span className="text-xs text-white/50 uppercase">Avg Severity</span><p className="text-2xl font-bold" style={{ color: severityColor(m.avgSeverity), fontFamily: 'Space Grotesk' }}>{m.avgSeverity}</p></div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <span className="text-xs text-white/50 uppercase">Top Category</span>
                            <p className="font-semibold">{categoryLabels[m.topCategory] || m.topCategory}</p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <span className="text-[10px] text-white/50 uppercase block mb-2 cursor-help group relative">Activity Profile
                              <div className="hidden group-hover:block absolute left-0 top-5 z-50 w-56 p-2 rounded-lg text-xs text-white/80 bg-[#171f33] border border-white/15 shadow-lg normal-case tracking-normal">Flag distribution across harm categories. Taller bars = more flags in that category.</div>
                            </span>
                            <div className="flex gap-1 items-end h-8">
                              {Object.entries(m.categories).slice(0, 5).map(([cat, v], j) => {
                                const maxVal = Math.max(...Object.values(m.categories))
                                return (
                                  <div key={j} className="flex-1 flex flex-col items-center gap-0.5">
                                    <div className="w-full rounded-sm" style={{ height: `${maxVal ? (v / maxVal) * 32 : 0}px`, backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length], opacity: 0.4 + (v / (maxVal || 1)) * 0.6 }} />
                                    <span className="text-[7px] text-white/30 truncate w-full text-center">{(categoryLabels[cat] || cat).slice(0, 6)}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </section>
                      )
                    })}
                    {sorted.length >= 2 && (
                      <section className="rounded-xl p-6" style={{ background: 'rgba(243,213,157,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(243,213,157,0.2)' }}>
                        <h4 className="text-xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk' }}>Cross-Comparison</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between text-xs uppercase" style={{ fontFamily: 'Space Grotesk' }}>
                            {sorted.map((m, i) => (
                              <span key={m.name} style={{ color: MODEL_COLORS[i % MODEL_COLORS.length] }}>{m.name} {Math.round((m.totalFlags / totalAll) * 100)}%</span>
                            ))}
                          </div>
                          <div className="h-3 w-full bg-white/5 rounded-full flex overflow-hidden">
                            {sorted.map((m, i) => (
                              <div key={m.name} className="h-full" style={{ width: `${(m.totalFlags / totalAll) * 100}%`, backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                            ))}
                          </div>
                          {sorted.length === 2 && (() => {
                            const [a, b] = sorted
                            const higher = a.totalFlags >= b.totalFlags ? a : b
                            const lower = a.totalFlags < b.totalFlags ? a : b
                            const ratio = lower.totalFlags > 0 ? (higher.totalFlags / lower.totalFlags).toFixed(1) : 'N/A'
                            return <p className="text-sm text-white/50 italic">&ldquo;{higher.name} shows {ratio}x more flags compared to {lower.name} baseline.&rdquo;</p>
                          })()}
                        </div>
                      </section>
                    )}
                  </div>
                )
              })()}

              {/* Section 6: Language Analysis */}
              {report.languageFlags.length > 0 && (
                <section className="rounded-xl p-6 glass-card">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Cross-Lingual Vulnerabilities</h3>
                  <div className="space-y-3">
                    {report.languageFlags.map((lf, i) => (
                      <div key={i} className="p-3 bg-white/5 rounded-lg border-l-4" style={{ borderLeftColor: COLORS.blue }}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/50">{categoryLabels[lf.category] || lf.category}</span>
                          <span style={{ color: severityColor(lf.severity) }}>Severity: {lf.severity}</span>
                        </div>
                        <p className="text-sm text-white/80">{lf.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section 7: Top Flagged Prompts */}
              <section className="rounded-xl overflow-hidden glass-card">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>High-Priority Security Flags</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {report.topPrompts.map((tp, i) => (
                    <div key={i} className="p-4 flex items-center gap-4 hover:bg-white/5 border-l-4" style={{ borderLeftColor: severityColor(tp.severity) }}>
                      <div className="text-center min-w-[50px]">
                        <p className="text-2xl font-bold" style={{ color: severityColor(tp.severity), fontFamily: 'Space Grotesk' }}>{tp.severity}</p>
                        <p className="text-[8px] uppercase text-white/50">Sev</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium">{tp.prompt}</p>
                        <div className="flex gap-3 mt-1">
                          <Badge variant="outline" className="text-[10px] border-white/20">{categoryLabels[tp.category] || tp.category}</Badge>
                          <span className="text-[10px] text-white/50">{tp.count} flags</span>
                          <span className="text-[10px] text-white/50">{tp.model}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* AI Summary */}
              {summary && (
                <section ref={summaryRef} className="rounded-2xl p-8 relative overflow-hidden" style={{ background: '#0F172A', border: '2px solid rgba(243,213,157,0.4)', boxShadow: '0 0 50px rgba(243,213,157,0.1)' }}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-[#F3D59D] text-[#0b1326] text-[10px] font-bold uppercase tracking-widest">AI Governance Summary</Badge>
                        {summaryModel && <Badge variant="outline" className="text-[10px] border-white/20">{summaryModel}</Badge>}
                      </div>
                      <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Key Strategic Insights</h2>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={copySummary} className="p-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition-colors" title="Copy to clipboard">
                        {copied
                          ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6bcb77" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3D59D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        }
                      </button>
                      <button onClick={exportSummaryPdf} className="p-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition-colors" title="Export as PDF">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3D59D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-white/80">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                      li: ({ children }) => (
                        <li className="border-l-2 border-[#F3D59D]/40 pl-4 py-3 bg-white/[0.03] rounded-r my-3 list-none" style={{ color: '#d0c5b6' }}>
                          <span className="[&>strong]:text-white [&>strong]:font-semibold">{children}</span>
                        </li>
                      ),
                      p: ({ children }) => {
                        const text = String(children)
                        if (text.toLowerCase().includes('recommendation:')) {
                          return <p className="text-[#F3D59D] font-bold border-l-2 border-[#F3D59D] pl-4 py-2 bg-[#F3D59D]/5 rounded-r">{children}</p>
                        }
                        return <p className="mb-4">{children}</p>
                      }
                    }}>{summary}</ReactMarkdown>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  )
}
