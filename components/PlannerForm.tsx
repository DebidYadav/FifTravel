'use client'

import { useState, useRef, useEffect } from 'react'
import { PlanRequest } from '@/lib/types'

// FIFA World Cup 2026 — 48 participating nations
const ALL_COUNTRIES = [
  // Hosts (CONCACAF)
  'Canada', 'Mexico', 'United States',
  // CONMEBOL
  'Argentina', 'Bolivia', 'Brazil', 'Colombia', 'Ecuador', 'Uruguay', 'Venezuela',
  // UEFA
  'Austria', 'Belgium', 'Croatia', 'Czech Republic', 'Denmark', 'England',
  'France', 'Germany', 'Hungary', 'Netherlands', 'Poland', 'Portugal',
  'Romania', 'Serbia', 'Spain', 'Switzerland', 'Türkiye',
  // CONCACAF (non-hosts)
  'Costa Rica', 'Jamaica', 'Panama',
  // CAF
  'Algeria', 'Cameroon', 'Egypt', 'Ghana', 'Ivory Coast', 'Morocco',
  'Nigeria', 'Senegal', 'South Africa',
  // AFC
  'Australia', 'Iran', 'Iraq', 'Japan', 'Jordan',
  'Saudi Arabia', 'South Korea', 'Uzbekistan',
  // OFC
  'New Zealand',
]

const CITIES = ['New York', 'Los Angeles', 'Miami', 'Chicago', 'Dallas', 'Houston', 'Mexico City', 'Toronto', 'Vancouver']
const NATIONALITIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola',
  'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus',
  'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
  'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'DR Congo', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
  'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'São Tomé and Príncipe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden',
  'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
  'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia',
  'Türkiye', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe',
]
const STAGES = ['Group Stage', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final']

interface Props {
  onSubmit: (req: PlanRequest) => void
  loading: boolean
}

export default function PlannerForm({ onSubmit, loading }: Props) {
  const [team, setTeam] = useState('Argentina')
  const [search, setSearch] = useState('Argentina')
  const [open, setOpen] = useState(false)
  const [budget, setBudget] = useState(3000)
  const [startCity, setStartCity] = useState('New York')
  const [stages, setStages] = useState<string[]>(['Group Stage', 'Round of 16'])
  const [nationality, setNationality] = useState('United States')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = ALL_COUNTRIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  )

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch(team) // reset search to selected on blur
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [team])

  const select = (country: string) => {
    setTeam(country)
    setSearch(country)
    setOpen(false)
  }

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
        <div className="relative" ref={dropdownRef}>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => { setSearch(''); setOpen(true) }}
            placeholder="Search country…"
            className="w-full glass rounded-xl px-3 py-2.5 text-sm text-white bg-transparent border border-white/10 focus:border-green-500 outline-none placeholder:text-gray-500"
          />
          {open && filtered.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur shadow-xl">
              {filtered.map(c => (
                <li
                  key={c}
                  onMouseDown={() => select(c)}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    c === team
                      ? 'bg-green-500/20 text-green-300'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
        {team && (
          <p className="mt-1.5 text-xs text-gray-500">
            Selected: <span className="text-green-400 font-semibold">{team}</span>
          </p>
        )}
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
