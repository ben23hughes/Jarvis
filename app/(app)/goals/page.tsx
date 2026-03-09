'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import {
  Sparkles, Dumbbell, DollarSign, Briefcase, Heart, BookOpen, Star, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GoalCard } from '@/components/goals/goal-card'
import { GoalForm } from '@/components/goals/goal-form'
import type { Goal, GoalCategory } from '@/lib/goals'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CATEGORIES: {
  value: GoalCategory
  label: string
  icon: React.ElementType
  color: string
  bg: string
}[] = [
  { value: 'spiritual',     label: 'Spiritual',     icon: Sparkles,   color: 'text-violet-600',  bg: 'bg-violet-100 dark:bg-violet-900/20' },
  { value: 'physical',      label: 'Physical',      icon: Dumbbell,   color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  { value: 'financial',     label: 'Financial',     icon: DollarSign, color: 'text-amber-600',   bg: 'bg-amber-100 dark:bg-amber-900/20' },
  { value: 'career',        label: 'Career',        icon: Briefcase,  color: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-900/20' },
  { value: 'relationships', label: 'Relationships', icon: Heart,      color: 'text-rose-600',    bg: 'bg-rose-100 dark:bg-rose-900/20' },
  { value: 'learning',      label: 'Learning',      icon: BookOpen,   color: 'text-indigo-600',  bg: 'bg-indigo-100 dark:bg-indigo-900/20' },
  { value: 'other',         label: 'Other',         icon: Star,       color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800/40' },
]

export default function GoalsPage() {
  const { data, isLoading, mutate } = useSWR('/api/goals', fetcher)
  const goals: Goal[] = data?.goals ?? []

  const [addingCategory, setAddingCategory] = useState<GoalCategory | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const activeGoals = goals.filter((g) => g.status !== 'completed')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  const handleSaved = useCallback((saved: Goal) => {
    mutate(
      (prev: { goals: Goal[] } | undefined) => {
        const existing = prev?.goals ?? []
        const idx = existing.findIndex((g) => g.id === saved.id)
        if (idx >= 0) {
          const updated = [...existing]
          updated[idx] = saved
          return { goals: updated }
        }
        return { goals: [...existing, saved] }
      },
      false
    )
    setAddingCategory(null)
  }, [mutate])

  const handleDeleted = useCallback((id: string) => {
    mutate(
      (prev: { goals: Goal[] } | undefined) => ({
        goals: (prev?.goals ?? []).filter((g) => g.id !== id),
      }),
      false
    )
  }, [mutate])

  const totalActive = activeGoals.length
  const avgProgress = totalActive > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / totalActive)
    : 0

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your long-term vision. Jarvis uses these to help you navigate day-to-day decisions.
          </p>
        </div>
        {totalActive > 0 && (
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold">{avgProgress}%</p>
            <p className="text-xs text-muted-foreground">avg progress</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.map(({ value, label, icon: Icon, color, bg }) => {
            const categoryGoals = activeGoals.filter((g) => g.category === value)
            const isAdding = addingCategory === value

            return (
              <section key={value} className="space-y-3">
                {/* Category header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-md p-1.5 ${bg}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <h2 className="font-semibold">{label}</h2>
                    {categoryGoals.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {categoryGoals.length} goal{categoryGoals.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddingCategory(isAdding ? null : value)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Add form */}
                {isAdding && (
                  <GoalForm
                    defaultCategory={value}
                    onSaved={handleSaved}
                    onCancel={() => setAddingCategory(null)}
                  />
                )}

                {/* Goals */}
                {categoryGoals.length === 0 && !isAdding ? (
                  <p className="text-sm text-muted-foreground py-2 pl-1">
                    No {label.toLowerCase()} goals yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categoryGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onUpdated={handleSaved}
                        onDeleted={handleDeleted}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {/* Completed goals */}
          {completedGoals.length > 0 && (
            <section className="space-y-3">
              <button
                onClick={() => setShowCompleted((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {showCompleted ? '▾' : '▸'} Completed ({completedGoals.length})
              </button>
              {showCompleted && (
                <div className="space-y-2">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdated={handleSaved}
                      onDeleted={handleDeleted}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {goals.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-1">No goals yet</p>
              <p className="text-sm">Add your first goal in any category above — Jarvis will keep them in mind as it helps you.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
