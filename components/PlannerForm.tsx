'use client'

import { useState } from 'react'
import { PlanRequest } from '@/lib/types'

const TEAMS = ['Argentina', 'Brazil', 'England', 'France', 'Germany']
const CITIES = ['New York', 'Los Angeles', 'Miami', 'Chicago', 'Dallas', 'Houston', 'Mexico City', 'Toronto', 'Vancouver']
const NATIONALITIES = ['US Citizen', 'EU Citizen', 'UK Citizen', 'Australian', 'Other']
const STAGES = ['Group Stage', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final']

interface Props {
  onSubmit: (req: PlanRequest) => void
  loading: boolean
}

export default function PlannerForm({ onSubmit, loading }: Props) {
  const [team, setTeam] = useState('Argentina')
  const [budget, setBudget] = useState(3000)
  const [startCity, setStartCity] = useState('New York')
  const [stages, setStages] = useState<string[]>(['Group Stage', 'Round of 16'])
  const [nationality, setNationality] = useState('US Citizen')

  const toggleStage = (stage: string) => {
    setStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ team, budget, startCity, stages, nationality })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Team */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Follow which team?
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {TEAMS.map(t => (
            <button
              key={t} type="button"
              onClick={() => setTeam(t)}
              className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all border ${
                team === t
                  ? 'bg-green-500/20 border-green-500 text-green-300 glow-green'
                  : 'glass border-white/10 text-gray-300 hover:border-white/30'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Budget: <span className="text-green-400">${budget.toLocaleString()}</span>
        </label>
        <input
          type="range" min={1000} max={10000} step={250}
          value={budget} onChange={e => setBudget(Number(e.target.value))}
          className="w-full accent-green-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$1,000</span><span>$10,000</span>
        </div>
      </div>

      {/* Start City & Nationality */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Departing from
          </label>
          <select
            value={startCity} onChange={e => setStartCity(e.target.value)}
            className="w-full glass rounded-xl px-3 py-2 text-sm text-white bg-transparent border border-white/10 focus:border-green-500 outline-none"
          >
            {CITIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Your passport
          </label>
          <select
            value={nationality} onChange={e => setNationality(e.target.value)}
            className="w-full glass rounded-xl px-3 py-2 text-sm text-white bg-transparent border border-white/10 focus:border-green-500 outline-none"
          >
            {NATIONALITIES.map(n => <option key={n} value={n} className="bg-gray-900">{n}</option>)}
          </select>
        </div>
      </div>

      {/* Stages */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Stages to attend
        </label>
        <div className="flex flex-wrap gap-2">
          {STAGES.map(s => (
            <button
              key={s} type="button"
              onClick={() => toggleStage(s)}
              className={`py-1.5 px-3 rounded-full text-xs font-semibold transition-all border ${
                stages.includes(s)
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                  : 'glass border-white/10 text-gray-400 hover:border-white/30'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit" disabled={loading || stages.length === 0}
        className="w-full py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all
          bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400
          disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg glow-green"
      >
        {loading ? '⚙️  Agents working…' : '🚀  Plan My Trip'}
      </button>
    </form>
  )
}
