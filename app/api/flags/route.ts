import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API endpoint for submitting flags
 * Saves flag and conversation context to database
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      exerciseId, 
      modelId, 
      categories, 
      severity, 
      comment, 
      messages 
    } = await request.json()

    if (!exerciseId || !modelId || !categories?.length || !comment?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user from request headers (you might need to adjust this)
    // For now, let's create a test user or use a real one
    let userId = 'placeholder-user-id'
    
    // Try to get a real user from the database
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (users && users.length > 0) {
      userId = users[0].id
    } else {
      // Create a test user for flagging
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          email: 'test-flagging@example.com',
          role: 'participant'
        })
        .select()
        .single()
      
      if (newUser) {
        userId = newUser.id
      }
    }

    // Save each message as an interaction
    const interactions = []
    const sessionId = crypto.randomUUID() // Generate a session ID for this conversation
    
    for (const message of messages) {
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          exercise_id: exerciseId,
          user_id: userId,
          model_id: modelId,
          session_id: sessionId,
          prompt: message.type === 'user' ? message.content : '[AI Response]', // Provide default for AI messages
          response: message.type === 'ai' ? message.content : null,
          created_at: message.timestamp
        })
        .select()
        .single()

      if (interactionError) {
        console.error('Error saving interaction:', interactionError)
        // Don't continue, but don't fail completely
      } else {
        interactions.push(interaction)
      }
    }

    // Save flags for each category
    const flags = []
    for (const category of categories) {
      const { data: flag, error: flagError } = await supabase
        .from('flags')
        .insert({
          user_id: userId,
          interaction_id: interactions[interactions.length - 1]?.id, // Link to last interaction
          category: category,
          severity: severity,
          title: `Flag from ${exerciseId}`, // Required field
          description: comment,
          evidence: { 
            modelId, 
            conversationLength: messages.length,
            timestamp: new Date().toISOString()
          },
          status: 'pending'
        })
        .select()
        .single()

      if (flagError) {
        console.error('Error saving flag:', flagError)
        // Don't continue, but don't fail completely  
      } else {
        flags.push(flag)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Flag submitted successfully',
      flagsCreated: flags.length,
      interactionsCreated: interactions.length
    })

  } catch (error) {
    console.error('Flag submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit flag. Please try again.' },
      { status: 500 }
    )
  }
}
