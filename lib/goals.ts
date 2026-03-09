import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type GoalCategory = 'spiritual' | 'physical' | 'financial' | 'career' | 'relationships' | 'learning' | 'other'
export type GoalStatus = 'active' | 'completed' | 'paused'

export interface Milestone {
  id: string
  text: string
  completed: boolean
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  category: GoalCategory
  status: GoalStatus
  progress: number
  target_date?: string
  why?: string
  milestones: Milestone[]
  created_at: string
  updated_at: string
}

export interface CreateGoalInput {
  title: string
  description?: string
  category: GoalCategory
  target_date?: string
  why?: string
  milestones?: Milestone[]
}

export interface UpdateGoalInput {
  title?: string
  description?: string
  category?: GoalCategory
  status?: GoalStatus
  progress?: number
  target_date?: string
  why?: string
  milestones?: Milestone[]
}

export async function listGoals(userId: string, category?: GoalCategory, status?: GoalStatus): Promise<Goal[]> {
  const supabase = getServiceClient()
  let q = supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (category) q = q.eq('category', category)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw new Error(`Failed to list goals: ${error.message}`)
  return (data ?? []) as Goal[]
}

export async function createGoal(userId: string, input: CreateGoalInput): Promise<Goal> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      target_date: input.target_date ?? null,
      why: input.why ?? null,
      milestones: input.milestones ?? [],
    })
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to create goal: ${error?.message}`)
  return data as Goal
}

export async function updateGoal(userId: string, goalId: string, input: UpdateGoalInput): Promise<Goal> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('goals')
    .update(input)
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error || !data) throw new Error(`Failed to update goal: ${error?.message}`)
  return data as Goal
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to delete goal: ${error.message}`)
}
