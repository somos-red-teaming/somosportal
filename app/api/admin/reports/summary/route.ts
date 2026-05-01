import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { AnthropicProvider } from '@/lib/ai-providers/anthropic'
import { GroqProvider } from '@/lib/ai-providers/groq'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.authorized) {
    return admin.response ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { reportData, maxWords = 500, sections, preferredModel = 'auto' } = await request.json()

    const defaultSections = [
      '1. **Executive Summary** — Key findings in 2-3 sentences',
      '2. **Severity Analysis** — Which categories show the widest severity contrasts and what this means',
      '3. **Model Comparison** — How the models differ in safety performance',
      '4. **Language & Cultural Bias** — Any patterns in language-related flags',
      '5. **Recommendations** — 3-5 actionable recommendations based on the data. Start each recommendation with **Recommendation:**',
    ]

    const sectionList = sections?.length ? sections : defaultSections

    const prompt = `You are an AI governance analyst. Analyze this red-teaming exercise data and write a concise governance report in markdown format.

Exercise: ${reportData.exerciseContext?.title || 'Unknown Exercise'}
${reportData.exerciseContext?.description ? `Description: ${reportData.exerciseContext.description}` : ''}

Write a report with these sections:
${sectionList.join('\n')}

Keep it professional, data-driven, and under ${maxWords} words. Reference the exercise name in your analysis.

Data:
${JSON.stringify(reportData, null, 2)}`

    // Try Claude Sonnet first (unless user prefers Groq)
    if (preferredModel !== 'groq') {
      try {
        const anthropic = new AnthropicProvider()
        const response = await anthropic.generateText(prompt, {
          model: 'claude-sonnet-4-20250514',
          maxTokens: Math.max(2000, Math.round(maxWords * 2)),
          temperature: 0.3
        })
        return NextResponse.json({ summary: response.content, model: 'Claude Sonnet' })
      } catch {
        if (preferredModel === 'claude') {
          return NextResponse.json({ error: 'Claude unavailable' }, { status: 500 })
        }
        // Fall back to Groq
      }
    }

    const groq = new GroqProvider()
    const response = await groq.generateText(prompt, {
      model: 'llama-3.3-70b-versatile',
      maxTokens: Math.max(2000, Math.round(maxWords * 2)),
      temperature: 0.3
    })
    return NextResponse.json({ summary: response.content, model: 'Groq Llama' })
  } catch {
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
