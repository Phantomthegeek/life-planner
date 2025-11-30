import { createClient } from '@/lib/supabase/server'
import { AICoachResponse } from '@/lib/types'

export interface PredictionOutcome {
  prediction_type: 'duration' | 'completion_likelihood' | 'optimal_time' | 'plan_mode'
  predicted_value: any
  actual_value: any
  task_id?: string
  plan_id?: string
  user_id: string
  accuracy: number // 0-1
  timestamp: string
}

export interface PersonalizationModel {
  user_id: string
  duration_prediction_accuracy: number
  completion_likelihood_accuracy: number
  optimal_time_accuracy: number
  plan_mode_accuracy: number
  confidence_scores: Record<string, number>
  last_updated: string
}

export class LearningLoop {
  /**
   * Record the outcome of an AI prediction
   */
  async recordOutcome(
    userId: string,
    prediction: {
      type: 'duration' | 'completion_likelihood' | 'optimal_time' | 'plan_mode'
      predicted: any
      taskId?: string
      planId?: string
    },
    actual: any
  ): Promise<void> {
    const supabase = createClient()

    // Calculate accuracy
    let accuracy = 0

    if (prediction.type === 'duration') {
      // Compare predicted vs actual duration
      const diff = Math.abs(prediction.predicted - actual)
      const percentageError = diff / Math.max(prediction.predicted, actual)
      accuracy = Math.max(0, 1 - percentageError)
    } else if (prediction.type === 'completion_likelihood') {
      // Compare predicted likelihood vs actual completion (0 or 1)
      const predictedLikelihood = prediction.predicted
      const actualCompletion = actual ? 1 : 0
      accuracy = 1 - Math.abs(predictedLikelihood - actualCompletion)
    } else if (prediction.type === 'optimal_time') {
      // Check if actual time was in predicted optimal hours
      const actualHour = new Date(actual).getHours()
      const optimalHours = Array.isArray(prediction.predicted) 
        ? prediction.predicted 
        : [prediction.predicted]
      accuracy = optimalHours.includes(actualHour) ? 1 : 0.5
    } else if (prediction.type === 'plan_mode') {
      // Compare suggested mode vs what user actually did
      accuracy = prediction.predicted === actual ? 1 : 0.3
    }

    // Save outcome
    const { error } = await supabase
      .from('task_completion_history')
      .update({
        estimated_minutes: prediction.type === 'duration' ? prediction.predicted : undefined,
        actual_minutes: prediction.type === 'duration' ? actual : undefined,
        completed_on_time: prediction.type === 'completion_likelihood' ? actual : undefined,
      })
      .eq('task_id', prediction.taskId || '')
      .limit(1)

    // Update pattern accuracy
    await this.updatePatternAccuracy(userId, prediction.type, accuracy)
  }

  /**
   * Update pattern accuracy metrics
   */
  private async updatePatternAccuracy(
    userId: string,
    patternType: string,
    accuracy: number
  ): Promise<void> {
    const supabase = createClient()

    // Get current pattern
    const { data: existing } = await supabase
      .from('productivity_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('pattern_type', `${patternType}_accuracy`)
      .single()

    const newConfidence = existing
      ? (existing.confidence_score * 0.9 + accuracy * 0.1) // Weighted moving average
      : accuracy

    // Upsert pattern
    await supabase
      .from('productivity_patterns')
      .upsert({
        user_id: userId,
        pattern_type: `${patternType}_accuracy`,
        pattern_data: {
          accuracy,
          confidence: newConfidence,
          last_updated: new Date().toISOString(),
        },
        confidence_score: newConfidence,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id,pattern_type',
      })
  }

  /**
   * Get personalization model for user
   */
  async getPersonalizationModel(userId: string): Promise<PersonalizationModel> {
    const supabase = createClient()

    const { data: patterns } = await supabase
      .from('productivity_patterns')
      .select('*')
      .eq('user_id', userId)
      .like('pattern_type', '%_accuracy')

    const model: PersonalizationModel = {
      user_id: userId,
      duration_prediction_accuracy: 0.7,
      completion_likelihood_accuracy: 0.7,
      optimal_time_accuracy: 0.7,
      plan_mode_accuracy: 0.7,
      confidence_scores: {},
      last_updated: new Date().toISOString(),
    }

    patterns?.forEach((pattern) => {
      if (pattern.pattern_type === 'duration_accuracy') {
        model.duration_prediction_accuracy = pattern.confidence_score
      } else if (pattern.pattern_type === 'completion_likelihood_accuracy') {
        model.completion_likelihood_accuracy = pattern.confidence_score
      } else if (pattern.pattern_type === 'optimal_time_accuracy') {
        model.optimal_time_accuracy = pattern.confidence_score
      } else if (pattern.pattern_type === 'plan_mode_accuracy') {
        model.plan_mode_accuracy = pattern.confidence_score
      }
    })

    return model
  }

  /**
   * Calculate overall AI accuracy for user
   */
  async getOverallAccuracy(userId: string): Promise<number> {
    const model = await this.getPersonalizationModel(userId)
    
    const avgAccuracy = (
      model.duration_prediction_accuracy +
      model.completion_likelihood_accuracy +
      model.optimal_time_accuracy +
      model.plan_mode_accuracy
    ) / 4

    return Math.round(avgAccuracy * 100) / 100
  }
}

export const learningLoop = new LearningLoop()

