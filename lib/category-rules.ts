import { createClient } from "@/lib/supabase/server"

export interface CategoryRule {
  id?: string
  user_id: string
  name: string
  description_pattern: string
  category_id: string
  priority: number
  is_active: boolean
}

export interface SmartAssignment {
  transactionId: string
  categoryId: string
  confidence: number
  reason: string
}

export async function createCategoryRule(rule: Omit<CategoryRule, 'id'>): Promise<CategoryRule | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('category_rules')
    .insert(rule)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating rule:', error)
    return null
  }
  
  return data
}

export async function getCategoryRules(userId: string): Promise<CategoryRule[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('category_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: false })
  
  if (error) {
    console.error('Error fetching rules:', error)
    return []
  }
  
  return data || []
}

export async function assignCategoryByRules(description: string, userId: string): Promise<string | null> {
  const rules = await getCategoryRules(userId)
  
  for (const rule of rules) {
    const pattern = new RegExp(rule.description_pattern, 'i')
    if (pattern.test(description)) {
      return rule.category_id
    }
  }
  
  return null
}

export async function learnFromAssignment(transactionId: string, categoryId: string, userId: string) {
  const supabase = await createClient()
  
  // Get transaction details
  const { data: transaction } = await supabase
    .from('transactions')
    .select('description')
    .eq('id', transactionId)
    .single()
  
  if (!transaction) return
  
  // Check if similar pattern exists
  const words = transaction.description.toLowerCase().split(' ')
  const significantWords = words.filter(word => word.length > 3)
  
  for (const word of significantWords) {
    // Check if we should create a rule for this pattern
    const { data: similarTransactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .ilike('description', `%${word}%`)
    
    if (similarTransactions && similarTransactions.length >= 3) {
      // Create or update rule
      await supabase
        .from('category_rules')
        .upsert({
          user_id: userId,
          name: `Auto: ${word}`,
          description_pattern: word,
          category_id: categoryId,
          priority: 1,
          is_active: true
        })
    }
  }
}

export async function suggestCategories(description: string, amount: number, userId: string): Promise<SmartAssignment[]> {
  const supabase = await createClient()
  const suggestions: SmartAssignment[] = []
  
  // Rule-based assignment
  const ruleCategory = await assignCategoryByRules(description, userId)
  if (ruleCategory) {
    suggestions.push({
      transactionId: '',
      categoryId: ruleCategory,
      confidence: 0.9,
      reason: 'Rule match'
    })
  }
  
  // Pattern learning from similar transactions
  const words = description.toLowerCase().split(' ')
  const { data: similarTransactions } = await supabase
    .from('transactions')
    .select('category_id, categories(name)')
    .eq('user_id', userId)
    .not('category_id', 'is', null)
  
  if (similarTransactions) {
    const categoryScores: { [key: string]: number } = {}
    
    for (const tx of similarTransactions) {
      if (!tx.category_id) continue
      
      const similarity = calculateSimilarity(description, tx.description || '')
      if (similarity > 0.3) {
        categoryScores[tx.category_id] = (categoryScores[tx.category_id] || 0) + similarity
      }
    }
    
    // Sort by score and add top suggestions
    const sortedCategories = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
    
    for (const [categoryId, score] of sortedCategories) {
      if (!suggestions.find(s => s.categoryId === categoryId)) {
        suggestions.push({
          transactionId: '',
          categoryId,
          confidence: Math.min(score, 0.8),
          reason: 'Similar transactions'
        })
      }
    }
  }
  
  return suggestions
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(' ')
  const words2 = str2.toLowerCase().split(' ')
  
  const commonWords = words1.filter(word => 
    word.length > 3 && words2.includes(word)
  )
  
  return commonWords.length / Math.max(words1.length, words2.length)
}
