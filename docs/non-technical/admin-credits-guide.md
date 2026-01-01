# Admin Credits Management Guide

**Document Type:** Non-Technical Guide  
**Last Updated:** January 1, 2026  
**Audience:** Platform Administrators

---

## What Are Credits?

Credits control how many messages users can send to expensive AI models. Free models (like Gemini and Groq) don't use credits. Custom or research models may cost 1 or more credits per message.

---

## Viewing User Credits

1. Go to **Admin → Users**
2. Find the **Credits** column in the table
3. Each user's current balance is displayed

---

## Adding Credits to a User

1. Go to **Admin → Users**
2. Find the user in the table
3. In the **Credits** column, you'll see their balance and an input field
4. Type the number of credits to add (e.g., `50`)
5. Press **Enter**
6. The credits are added to their existing balance

**Example:** User has 10 credits. You enter 50. They now have 60 credits.

---

## Setting Model Costs

1. Go to **Admin → Models**
2. Click **Edit** on a model
3. Find **Credit Cost per Message**
4. Enter the cost:
   - `0` = Free (no credits needed)
   - `1` = 1 credit per message
   - `2` = 2 credits per message
5. Click **Update Model**

### Recommended Costs

| Model Type | Cost |
|------------|------|
| Gemini, Groq | 0 (free) |
| Custom APIs | 1 |
| Expensive/Limited APIs | 2-5 |

---

## When Users Run Out

When a user has insufficient credits:
- They see an error message in the chat
- They can still use free models (cost = 0)
- They need an admin to add more credits

---

## Checking Credit Usage

Currently, there's no usage history. To see who's using credits:
1. Check the **Credits** column in Admin → Users
2. Users with low balances have been active with paid models

---

## Tips

- **New users start with 100 credits** - This is the default
- **Free models don't use credits** - Set Gemini/Groq to cost 0
- **Add credits generously** - 50-100 at a time is reasonable
- **Monitor low balances** - Help active users before they run out

---

*Last Updated: January 1, 2026*
