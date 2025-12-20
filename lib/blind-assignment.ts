import { supabase } from './supabase'

// Blind names for models (in order of assignment)
const BLIND_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta']

/**
 * Get the blind name for a model in a specific exercise
 * @param exerciseId - The exercise ID
 * @param modelId - The model ID
 * @returns The blind name (Alpha, Beta, etc.) or null if not found
 */
export async function getBlindName(exerciseId: string, modelId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('exercise_models')
      .select('blind_name')
      .eq('exercise_id', exerciseId)
      .eq('model_id', modelId)
      .single()

    if (error || !data) {
      return null
    }

    return data.blind_name
  } catch (error) {
    console.error('Error getting blind name:', error)
    return null
  }
}

/**
 * Get model configuration by exercise and blind name
 * @param exerciseId - The exercise ID
 * @param blindName - The blind name (Alpha, Beta, etc.)
 * @returns The model configuration or null if not found
 */
export async function getModelConfig(exerciseId: string, blindName: string) {
  try {
    const { data, error } = await supabase
      .from('exercise_models')
      .select(`
        model_id,
        blind_name,
        ai_models (
          id,
          name,
          provider,
          model_id,
          capabilities,
          is_active
        )
      `)
      .eq('exercise_id', exerciseId)
      .eq('blind_name', blindName)
      .single()

    if (error || !data) {
      return null
    }

    return {
      modelId: data.model_id,
      blindName: data.blind_name,
      model: data.ai_models
    }
  } catch (error) {
    console.error('Error getting model config:', error)
    return null
  }
}

/**
 * Assign models to an exercise with automatic blind name assignment
 * @param exerciseId - The exercise ID
 * @param modelIds - Array of model IDs to assign
 * @returns Array of assignments with blind names
 */
export async function assignModelsToExercise(exerciseId: string, modelIds: string[]) {
  try {
    // First, clear existing assignments for this exercise
    await supabase
      .from('exercise_models')
      .delete()
      .eq('exercise_id', exerciseId)

    // Create new assignments with blind names
    const assignments = modelIds.map((modelId, index) => ({
      exercise_id: exerciseId,
      model_id: modelId,
      blind_name: BLIND_NAMES[index] || `Model ${index + 1}` // Fallback if we run out of names
    }))

    const { data, error } = await supabase
      .from('exercise_models')
      .insert(assignments)
      .select()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error assigning models to exercise:', error)
    throw error
  }
}

/**
 * Get all models assigned to an exercise with their blind names
 * @param exerciseId - The exercise ID
 * @returns Array of model assignments
 */
export async function getExerciseModels(exerciseId: string) {
  try {
    const { data, error } = await supabase
      .from('exercise_models')
      .select(`
        model_id,
        blind_name,
        ai_models (
          id,
          name,
          display_name,
          provider,
          model_id,
          capabilities,
          is_active
        )
      `)
      .eq('exercise_id', exerciseId)
      .order('blind_name')

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error getting exercise models:', error)
    return []
  }
}

/**
 * Preview blind name assignments for given model IDs
 * @param modelIds - Array of model IDs
 * @returns Array of preview assignments
 */
export function previewBlindAssignments(modelIds: string[]) {
  return modelIds.map((modelId, index) => ({
    modelId,
    blindName: BLIND_NAMES[index] || `Model ${index + 1}`
  }))
}
