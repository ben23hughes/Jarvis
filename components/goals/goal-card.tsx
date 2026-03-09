'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { GoalForm } from './goal-form'
import type { Goal, Milestone } from '@/lib/goals'

interface GoalCardProps {
  goal: Goal
  onUpdated: (goal: Goal) => void
  onDeleted: (id: string) => void
}

export function GoalCard({ goal, onUpdated, onDeleted }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [localProgress, setLocalProgress] = useState(goal.progress)

  const completedMilestones = goal.milestones.filter((m) => m.completed).length
  const totalMilestones = goal.milestones.length

  async function handleProgressChange(value: number) {
    setLocalProgress(value)
  }

  async function handleProgressCommit(value: number) {
    if (value === goal.progress) return
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdated(data.goal)
    } catch {
      setLocalProgress(goal.progress)
      toast.error('Failed to update progress')
    }
  }

  async function toggleMilestone(ms: Milestone) {
    const updated = goal.milestones.map((m) =>
      m.id === ms.id ? { ...m, completed: !m.completed } : m
    )
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestones: updated }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdated(data.goal)
    } catch {
      toast.error('Failed to update milestone')
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this goal?')) return
    try {
      await fetch(`/api/goals/${goal.id}`, { method: 'DELETE' })
      toast.success('Goal deleted')
      onDeleted(goal.id)
    } catch {
      toast.error('Failed to delete')
    }
  }

  async function handleStatusToggle() {
    const next = goal.status === 'completed' ? 'active' : 'completed'
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, progress: next === 'completed' ? 100 : goal.progress }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdated(data.goal)
      toast.success(next === 'completed' ? 'Goal marked complete!' : 'Goal reactivated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (editing) {
    return (
      <GoalForm
        goal={goal}
        onSaved={(updated) => { onUpdated(updated); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const isComplete = goal.status === 'completed'

  return (
    <Card className={`p-4 transition-opacity ${isComplete ? 'opacity-70' : ''}`}>
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <button
              onClick={handleStatusToggle}
              className={`mt-0.5 shrink-0 transition-colors ${isComplete ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              title={isComplete ? 'Mark as active' : 'Mark as complete'}
            >
              {isComplete
                ? <CheckCircle2 className="h-5 w-5" />
                : <Circle className="h-5 w-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`font-medium leading-snug ${isComplete ? 'line-through text-muted-foreground' : ''}`}>
                {goal.title}
              </p>
              {goal.target_date && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditing(true)} className="p-1 text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleDelete} className="p-1 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {(goal.description || goal.why || totalMilestones > 0) && (
              <button onClick={() => setExpanded((v) => !v)} className="p-1 text-muted-foreground hover:text-foreground">
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{totalMilestones > 0 ? `${completedMilestones}/${totalMilestones} milestones` : 'Progress'}</span>
            <span>{localProgress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={localProgress}
            onChange={(e) => handleProgressChange(Number(e.target.value))}
            onMouseUp={(e) => handleProgressCommit(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => handleProgressCommit(Number((e.target as HTMLInputElement).value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
          />
        </div>

        {/* Expanded section */}
        {expanded && (
          <div className="space-y-3 pt-1 border-t">
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
            {goal.why && (
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Why this matters</p>
                <p className="text-sm">{goal.why}</p>
              </div>
            )}
            {totalMilestones > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Milestones</p>
                {goal.milestones.map((ms) => (
                  <button
                    key={ms.id}
                    onClick={() => toggleMilestone(ms)}
                    className="flex items-center gap-2 w-full text-left group"
                  >
                    {ms.completed
                      ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      : <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />}
                    <span className={`text-sm ${ms.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {ms.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
