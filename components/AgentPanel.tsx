'use client'

import { AgentStatus } from '@/lib/types'

const statusColors: Record<string, string> = {
  idle: 'text-gray-400',
  running: 'text-yellow-400',
  done: 'text-green-400',
  error: 'text-red-400',
}

const statusDot: Record<string, string> = {
  idle: 'bg-gray-600',
  running: 'bg-yellow-400 agent-pulse',
  done: 'bg-green-400',
  error: 'bg-red-400',
}

interface Props {
  agents: AgentStatus[]
}

export default function AgentPanel({ agents }: Props) {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
        🤖 Agent Activity
      </h3>
      {agents.map(agent => (
        <div key={agent.id} className="flex items-start gap-3">
          <div className="mt-1.5 relative flex-shrink-0">
            <span className={`block w-2.5 h-2.5 rounded-full ${statusDot[agent.status]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base">{agent.icon}</span>
              <span className="text-sm font-semibold text-white">{agent.name}</span>
              <span className={`text-xs font-medium ${statusColors[agent.status]}`}>
                {agent.status === 'running' ? 'Working…' : agent.status}
              </span>
            </div>
            {agent.message && (
              <p className={`text-xs mt-0.5 leading-relaxed ${agent.status === 'running' ? 'text-yellow-300/80 typing' : 'text-gray-400'}`}>
                {agent.message}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
