'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Plus, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Goal, GoalCategory, CreateGoalInput, UpdateGoalInput, Milestone } from '@/lib/goals'

const CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'physical', label: 'Physical' },
  { value: 'financial', label: 'Financial' },
  { value: 'career', label: 'Career' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' },
]

interface GoalFormProps {
  defaultCategory?: GoalCategory
  goal?: Goal
  onSaved: (goal: Goal) => void
  onCancel: () => void
}

export function GoalForm({ defaultCategory, goal, onSaved, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [category, setCategory] = useState<GoalCategory>(goal?.category ?? defaultCategory ?? 'other')
  const [why, setWhy] = useState(goal?.why ?? '')
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? '')
  const [milestones, setMilestones] = useState<Milestone[]>(goal?.milestones ?? [])
  const [newMilestone, setNewMilestone] = useState('')
  const [loading, setLoading] = useState(false)

  function addMilestone() {
    const text = newMilestone.trim()
    if (!text) return
    setMilestones((m) => [...m, { id: crypto.randomUUID(), text, completed: false }])
    setNewMilestone('')
  }

  function removeMilestone(id: string) {
    setMilestones((m) => m.filter((ms) => ms.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const payload: CreateGoalInput | UpdateGoalInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        why: why.trim() || undefined,
        target_date: targetDate || undefined,
        milestones,
      }

      const res = await fetch(goal ? `/api/goals/${goal.id}` : '/api/goals', {
        method: goal ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      toast.success(goal ? 'Goal updated' : 'Goal created')
      onSaved(data.goal)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{goal ? 'Edit goal' : 'New goal'}</h3>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as GoalCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Target date</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Description</Label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="More detail about this goal…"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Why does this matter to you?</Label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              rows={2}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Your deeper motivation — Jarvis will use this to keep you grounded"
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          <Label className="text-xs">Milestones</Label>
          {milestones.map((ms) => (
            <div key={ms.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-muted-foreground">{ms.text}</span>
              <button type="button" onClick={() => removeMilestone(ms.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              placeholder="Add a milestone…"
              className="h-8 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMilestone() } }}
            />
            <Button type="button" size="sm" variant="outline" onClick={addMilestone}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Saving…' : goal ? 'Save changes' : 'Create goal'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
