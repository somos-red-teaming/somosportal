# Admin Deliberation Map Guide

## Overview

The Deliberation Map is a visual tool for facilitating group discussions about AI harms discovered during red-teaming exercises. It displays flagged issues as a constellation-style graph where clusters represent harm categories and individual dots represent specific flags.

---

## Accessing the Deliberation Map

1. Log in as an admin
2. Go to **Dashboard** → **Admin Quick Actions** → **Deliberation Map**
3. Or go to **Admin** → **Deliberation Map** card → **View Map**
4. Or navigate directly to `/admin/deliberation`

---

## Reading the Visualization

### Clusters

Each group of dots represents a harm category:

| Element | Meaning |
|---------|---------|
| **Cluster label** | Category name with total flag count (e.g., "Misinformation (15)") |
| **Cluster color** | Each category has a unique color from the SOMOS palette |
| **Cluster size** | More flags = larger cluster area |

### Nodes (Dots)

Each dot is an individual flag submitted by a participant:

| Element | Meaning |
|---------|---------|
| **Dot size** | Larger = higher severity (1-10 scale) |
| **Dot color** | Matches its harm category |
| **Glowing dot** | High severity flag (8-10) |

### Legend Bar

The legend at the top shows:
- All categories with their color and percentage of total flags
- A severity scale showing how dot size maps to severity level

---

## Interacting with the Map

### Filtering by Exercise

Use the **exercise dropdown** in the top controls to view flags from a specific exercise. Select "All Exercises" to see everything.

### Zooming and Panning

- **Scroll** to zoom in/out
- **Click and drag** the background to pan
- Works with trackpad gestures on laptops

### Exploring Clusters

- **Hover** over any dot to see flag details: category, severity, model name, exercise, and a preview of the prompt
- **Click** a cluster label in the legend to isolate that category
- Click again or press the **✕ Clear filter** button to show all clusters

### Cluster Detail Panel

When you click a cluster, a panel slides in from the right showing:
- Total flags in that category
- Severity breakdown (high/medium/low)
- Status counts (pending/under review/resolved/dismissed)
- Top 5 prompts and AI responses from that category

This is useful for anchoring group conversations around specific harms.

### Fullscreen Mode

Click the **expand icon** (top right) to enter fullscreen — ideal for projecting during deliberation sessions. Press **Escape** or click the minimize icon to exit.

---

## Using During Deliberation Sessions

### Recommended Setup

1. Connect to a projector or shared screen
2. Open the Deliberation Map in fullscreen
3. Select the exercise you're discussing
4. Walk through clusters from largest to smallest

### Discussion Flow

1. **Overview** — Start with all clusters visible. Note which categories have the most flags.
2. **Deep dive** — Click into the largest cluster. Use the detail panel to read specific prompts and responses.
3. **Compare** — Switch between exercises to see if the same harms appear across different scenarios.
4. **Severity focus** — Look for glowing (high severity) nodes. These represent the most concerning findings.

---

*Last Updated: March 27, 2026*
