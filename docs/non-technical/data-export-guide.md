# Data Export Guide

**Document Type:** User Guide  
**Last Updated:** January 1, 2026  
**Audience:** Administrators

---

## Overview

SOMOS provides data export capabilities for administrators to download platform data for analysis, reporting, and compliance purposes.

---

## Accessing Data Export

### Option 1: Export Page (Recommended)

1. Log in as an admin
2. Go to **Dashboard** → **Export Data**
3. Or navigate directly to `/admin/export`

### Option 2: Direct API Access

Use the export API endpoints directly (see API section below).

---

## Export Page Features

### Date Range Filtering

Optionally filter exports by date:
- **From**: Start date (inclusive)
- **To**: End date (inclusive)
- Leave blank to export all data

### Available Exports

| Export | Description | Formats |
|--------|-------------|---------|
| **Flags** | All flagged content with categories, severity, reviewer notes | CSV, JSON |
| **Interactions** | AI conversations (prompts and responses) | CSV, JSON |
| **Exercises** | Exercise data with participant counts and flag statistics | CSV, JSON |

---

## Export Formats

### CSV
- Opens in Excel, Google Sheets, Numbers
- Best for spreadsheet analysis
- Flat structure (no nested data)

### JSON
- Best for programmatic processing
- Includes all nested data
- Can be imported into databases

---

## Flags Export

### Included Fields

| Field | Description |
|-------|-------------|
| ID | Unique flag identifier |
| Categories | Issue types (may be multiple) |
| Severity | 1-10 rating |
| Status | pending, under_review, resolved, dismissed |
| Description | Reporter's comment |
| Exercise | Exercise title |
| Model | AI model name |
| Submitted By | Reporter's email |
| Created | Submission timestamp |
| Reviewed | Review timestamp (if reviewed) |
| Notes | Reviewer notes |

### Sample CSV
```csv
ID,Categories,Severity,Status,Description,Exercise,Model,Submitted By,Created,Reviewed,Notes
abc-123,harmful_content; bias,8,resolved,"AI showed bias...",Test Exercise,Gemini,user@example.com,2026-01-01,2026-01-02,"Confirmed bias"
```

---

## Interactions Export

### Included Fields

| Field | Description |
|-------|-------------|
| ID | Unique interaction identifier |
| Exercise | Exercise title |
| Model | AI model name |
| Blind Name | Model's blind name (Alpha, Beta, etc.) |
| Prompt | User's message |
| Response | AI's response |
| User | User's email |
| Created | Timestamp |

### Sample CSV
```csv
ID,Exercise,Model,Blind Name,Prompt,Response,User,Created
xyz-789,Test Exercise,Gemini,Alpha,"What is AI?","AI is...",user@example.com,2026-01-01
```

---

## Exercises Export

### Included Fields

| Field | Description |
|-------|-------------|
| ID | Unique exercise identifier |
| Title | Exercise name |
| Category | Exercise category |
| Status | draft, active, completed, archived |
| Difficulty | beginner, intermediate, advanced |
| Participants | Current participant count |
| Max | Maximum participants allowed |
| Flags | Number of flags submitted |
| Start | Start date |
| End | End date |
| Created | Creation timestamp |

---

## API Endpoints

### Flags Export
```
GET /api/export/flags
GET /api/export/flags?format=csv
GET /api/export/flags?format=json&from=2026-01-01&to=2026-01-31
GET /api/export/flags?exercise_id=uuid
```

### Interactions Export
```
GET /api/export/interactions
GET /api/export/interactions?format=csv
GET /api/export/interactions?exercise_id=uuid
```

### Exercises Export
```
GET /api/export/exercises
GET /api/export/exercises?format=csv
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | `csv` or `json` (default: json) |
| from | date | Start date (YYYY-MM-DD) |
| to | date | End date (YYYY-MM-DD) |
| exercise_id | uuid | Filter by specific exercise |

---

## Use Cases

### Monthly Reporting
1. Go to Export page
2. Set date range for the month
3. Export Flags as CSV
4. Open in Excel for analysis

### Research Analysis
1. Export Interactions as JSON
2. Import into analysis tool (Python, R)
3. Analyze conversation patterns

### Compliance/Audit
1. Export all data (no date filter)
2. Store securely for records
3. Document export date and purpose

### Model Comparison
1. Export Flags as CSV
2. Filter/pivot by Model column
3. Compare flag counts across models

---

## Best Practices

1. **Regular Exports**: Schedule weekly/monthly exports for backup
2. **Secure Storage**: Store exported data securely (encrypted)
3. **Data Retention**: Follow your organization's data retention policy
4. **Access Control**: Limit who can perform exports
5. **Audit Trail**: Document when and why exports are performed

---

## Troubleshooting

### Export Not Downloading
- Check browser download settings
- Try a different format (CSV vs JSON)
- Check for popup blockers

### Empty Export
- Verify date range includes data
- Check if filters are too restrictive
- Ensure data exists in the system

### Large Export Timeout
- Use date range to limit data
- Export in smaller batches
- Use API directly for large datasets

---

*Last Updated: January 1, 2026*
