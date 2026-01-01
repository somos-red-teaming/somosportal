# Credits System

**Document Type:** Technical Documentation  
**Last Updated:** January 1, 2026  
**Platform:** SOMOS AI Red-Teaming Platform

---

## Overview

The credits system controls usage of expensive AI models. Users have a credit balance that's deducted when using models with a cost. Free models (Gemini, Groq) don't consume credits.

---

## How It Works

1. **Users** have a `credits` balance (default: 100)
2. **Models** have a `credit_cost` (0 = free, 1+ = costs credits)
3. Each AI message deducts the model's cost from user's balance
4. When credits reach 0, user can't use paid models

---

## Database Schema

### Users Table

```sql
ALTER TABLE public.users ADD COLUMN credits INTEGER DEFAULT 100;
```

### AI Models Table

```sql
ALTER TABLE public.ai_models ADD COLUMN credit_cost INTEGER DEFAULT 0;
```

### Migration File

```
/database/add-credits-system.sql
```

---

## Credit Costs by Model Type

| Model Type | Recommended Cost | Reason |
|------------|------------------|--------|
| Gemini (Google) | 0 | Free API |
| Groq (Llama) | 0 | Free API |
| Custom/Research | 1-2 | Limited quota |
| Government APIs | 2-5 | Expensive/restricted |

---

## API Behavior

### Chat API (`/api/ai/chat`)

**Before sending message:**
1. Check model's `credit_cost`
2. If cost > 0, verify user has enough credits
3. If insufficient, return `402 Payment Required`

**After successful response:**
1. Deduct `credit_cost` from user's balance
2. Return `creditsRemaining` in response

### Insufficient Credits Response

```json
{
  "error": "Insufficient credits",
  "creditsRequired": 1,
  "creditsAvailable": 0
}
```

**HTTP Status:** `402 Payment Required`

---

## User Interface

### Header Display

Credits shown in green next to theme toggle:
- Desktop: Always visible
- Mobile: Always visible

Updates live when messages are sent (no refresh needed).

### Insufficient Credits Message

When user runs out of credits, chat shows:
> "Insufficient credits. You need X credits but have 0. Contact an admin for more credits."

---

## Admin Management

### View User Credits

**Location:** Admin → Users

Each user row shows current credit balance.

### Top Up Credits

1. Go to Admin → Users
2. Find user in table
3. Enter amount in input field
4. Press Enter to add credits

Credits are added to existing balance (not replaced).

### Set Model Cost

1. Go to Admin → Models
2. Edit model
3. Set "Credit Cost per Message" field
4. Save

---

## Code Reference

### Credit Check (API)

```typescript
// /api/ai/chat/route.ts
const creditCost = model.credit_cost || 0
if (creditCost > 0 && userId) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single()

  if (!user || (user.credits ?? 0) < creditCost) {
    return NextResponse.json({ 
      error: 'Insufficient credits',
      creditsRequired: creditCost,
      creditsAvailable: user?.credits ?? 0
    }, { status: 402 })
  }

  // Deduct credits
  await supabaseAdmin
    .from('users')
    .update({ credits: (user.credits ?? 0) - creditCost })
    .eq('id', userId)
}
```

### Live Updates (Frontend)

```typescript
// ChatBox.tsx - calls callback on credit change
if (data.creditsRemaining !== null) {
  onCreditsUpdate?.(data.creditsRemaining)
}

// Header.tsx - listens for updates
useEffect(() => {
  const handler = (e: CustomEvent) => setCredits(e.detail)
  window.addEventListener('creditsUpdate', handler)
  return () => window.removeEventListener('creditsUpdate', handler)
}, [])
```

---

## Best Practices

1. **Set free models to 0 cost** - Don't charge for Gemini/Groq
2. **Start users with enough credits** - Default 100 is reasonable
3. **Monitor usage** - Check if users run out frequently
4. **Communicate costs** - Show credit cost in model selection if possible

---

## Future Enhancements

- [ ] Credit transaction history table
- [ ] Auto-refill credits on schedule
- [ ] Credit packages/tiers
- [ ] Usage analytics dashboard

---

*Last Updated: January 1, 2026*
