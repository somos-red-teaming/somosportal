# Admin Flag Management Guide

## Overview

The Flag Management system allows administrators to review, analyze, and manage flags submitted by participants during AI red-teaming exercises. This guide covers how to use the admin dashboard effectively.

---

## Accessing Flag Management

1. Log in as an admin
2. Go to **Dashboard** → **Admin Quick Actions** → **Manage Flags**
3. Or navigate directly to `/admin/flags`

---

## Dashboard Overview

### Stats Cards

At the top of the page, you'll see five summary cards:

| Card | Description |
|------|-------------|
| **Total Flags** | Total number of flags submitted |
| **Pending** | Flags waiting for review (yellow) |
| **Under Review** | Flags currently being investigated (blue) |
| **Resolved** | Flags that have been addressed (green) |
| **High Severity** | Flags with severity 8-10 (red) |

### Analytics Charts

Three charts provide visual insights:

1. **Flags by Category** - Shows which types of issues are most commonly reported
2. **Flags by Model** - Shows which AI models receive the most flags
3. **Top Submitters** - Shows which participants are most active in reporting

---

## Filtering Flags

Use the filter bar to narrow down flags:

- **Search**: Type to search within flag descriptions
- **Status**: Filter by pending, under review, resolved, or dismissed
- **Category**: Filter by issue type (harmful content, misinformation, etc.)

---

## Reviewing a Flag

1. Click the **eye icon** on any flag row to open the detail modal
2. Review the information:
   - **Categories**: What types of issues were reported
   - **Severity**: How serious the issue is (1-10)
   - **Exercise**: Which exercise this occurred in
   - **Model**: Which AI model was involved
   - **Submitted By**: Who reported the issue
   - **Description**: The reporter's explanation
   - **Flagged Conversation**: The full chat that was flagged

3. Add **Reviewer Notes** to document your findings

4. Take action:
   - **Mark Under Review**: Indicate you're investigating
   - **Resolve**: Confirm the issue and mark as addressed
   - **Dismiss**: Reject the flag (false positive, duplicate, etc.)

---

## Flag Status Workflow

```
New Flag → Pending → Under Review → Resolved
                          ↓
                      Dismissed
```

- **Pending**: Default status for new flags
- **Under Review**: Admin is actively investigating
- **Resolved**: Issue confirmed and addressed
- **Dismissed**: Flag rejected

---

## Exporting Data

### From Flags Page

Click **CSV** or **JSON** buttons to download all flags.

### From Export Page

1. Go to **Admin Dashboard** → **Export Data**
2. Optionally set date range filters
3. Choose what to export:
   - **Flags**: All flag data with categories, severity, notes
   - **Interactions**: AI conversations (prompts and responses)
   - **Exercises**: Exercise data with participant counts

---

## Understanding Flag Categories

| Category | What to Look For |
|----------|------------------|
| **Harmful Content** | Content that could cause physical, emotional, or financial harm |
| **Misinformation** | False claims presented as facts |
| **Bias/Discrimination** | Unfair treatment based on protected characteristics |
| **Privacy Violation** | Disclosure of personal information |
| **Inappropriate Response** | Offensive, vulgar, or unprofessional content |
| **Factual Error** | Incorrect information (dates, names, statistics) |
| **Off Topic** | Response doesn't address the user's question |
| **Spam** | Repetitive or nonsensical content |

---

## Severity Scale

| Level | Description | Action Priority |
|-------|-------------|-----------------|
| 1-3 | Minor issue | Low - review when time permits |
| 4-6 | Moderate issue | Medium - review within a few days |
| 7-8 | Serious issue | High - review within 24 hours |
| 9-10 | Critical issue | Urgent - review immediately |

---

## Best Practices

### Reviewing Flags

1. **Read the full conversation** - Context matters
2. **Check the severity** - Prioritize high-severity flags
3. **Document your findings** - Use reviewer notes
4. **Be consistent** - Apply the same standards to all flags

### Managing Workload

1. **Filter by pending** - Focus on unreviewed flags first
2. **Sort by severity** - Address critical issues first
3. **Use charts** - Identify patterns (e.g., one model getting many flags)
4. **Export regularly** - Keep records for analysis

### When to Dismiss

- Duplicate of another flag
- Misunderstanding by the reporter
- Not actually an issue
- Outside scope of the exercise

### When to Resolve

- Issue confirmed and documented
- Model behavior noted for improvement
- Pattern identified for future training

---

## Troubleshooting

### Can't see any flags?
- Check your filters - clear them to see all flags
- Ensure you're logged in as an admin

### Export not working?
- Try a different format (CSV vs JSON)
- Check your browser's download settings

### Charts not showing?
- Charts only appear when there's data
- Submit a test flag to see them

---

*Last Updated: January 1, 2026*
