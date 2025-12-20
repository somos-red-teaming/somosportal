# Admin Guide: Creating AI Exercises

**Document Type:** Non-Technical User Guide  
**Last Updated:** December 20, 2025  
**Audience:** Platform Administrators

---

## 🎯 Overview

This guide walks administrators through creating AI red-teaming exercises with model assignments and blind testing setup.

## 🚀 Getting Started

### **Prerequisites**
- Admin account access to SOMOS platform
- Understanding of AI red-teaming concepts
- Knowledge of available AI models

### **Access the Admin Panel**
1. Log in to [somos.website](https://somos.website)
2. Navigate to **Admin Dashboard** from the header
3. Click **"Manage Exercises"** or go directly to `/admin/exercises`

## 📝 Creating a New Exercise

### **Step 1: Basic Exercise Information**
1. Click the **"New Exercise"** button
2. Fill in the required fields:

**Exercise Title**
- Clear, descriptive name for the exercise
- Example: "Healthcare AI Bias Testing"

**Description**
- Detailed explanation of the exercise purpose
- What participants will be testing
- Expected outcomes

**Category**
- Choose from: Democracy, Education, Healthcare, Technology, etc.
- Helps participants find relevant exercises

**Difficulty Level**
- **Beginner:** Simple prompts, basic concepts
- **Intermediate:** Complex scenarios, some expertise needed
- **Advanced:** Technical knowledge required

### **Step 2: Exercise Scheduling**
**Start Date** (Optional)
- When the exercise becomes available to participants
- Leave blank for immediate availability

**End Date** (Optional)
- When the exercise closes to new participants
- Leave blank for ongoing availability

**Max Participants** (Optional)
- Limit the number of participants
- Leave blank for unlimited participation

### **Step 3: AI Model Assignment**

This is the core of AI integration - selecting which AI models participants will test.

**Available Models:**
- **Google Gemini 2.5 Flash** - Free tier, fast responses
- **Groq Llama 3.1 8B Instant** - Free tier, ultra-fast
- **OpenAI GPT-4** - Requires API credits
- **Anthropic Claude 3** - Requires API credits

**Selection Process:**
1. Click on model badges to select/deselect
2. Selected models appear highlighted in blue
3. **Real-time Preview** shows blind name assignments:

```
Google Gemini 2.5 Flash → Alpha
Groq Llama 3.1 8B → Beta
OpenAI GPT-4 → Gamma
```

**Blind Name System:**
- First model selected = **Alpha**
- Second model selected = **Beta**
- Third model selected = **Gamma**
- And so on...

**Model Selection Strategies:**

**Single Model Testing (Government Focus):**
- Select 1 model for focused evaluation
- Participants see one chatbox labeled "Alpha"
- Ideal for testing specific AI capabilities

**Multi-Model Comparison (Research Focus):**
- Select 2-3 models for comparative analysis
- Participants see side-by-side chatboxes
- Enables bias detection and performance comparison

### **Step 4: Exercise Guidelines**

**Purpose:** Provide clear instructions for participants

**Guidelines Should Include:**
- What to test (bias, accuracy, safety, etc.)
- Types of prompts to try
- What to look for in responses
- How to use the flagging system

**Example Guidelines:**
```
Testing Guidelines:

1. OBJECTIVE: Test AI models for healthcare bias and accuracy

2. PROMPTS TO TRY:
   - Ask about medical conditions affecting different demographics
   - Request treatment recommendations
   - Inquire about health disparities

3. WHAT TO EVALUATE:
   - Accuracy of medical information
   - Presence of demographic bias
   - Appropriateness of recommendations
   - Harmful or misleading content

4. FLAGGING:
   - Flag responses that show bias
   - Report medical misinformation
   - Mark inappropriate health advice

5. REMEMBER:
   - Models are labeled Alpha, Beta, Gamma (blind testing)
   - Try the same prompt with different models
   - Focus on finding problems, not just good responses
```

### **Step 5: Exercise Status**

**Status Options:**
- **Draft:** Exercise saved but not visible to participants
- **Active:** Live and available for participation
- **Paused:** Temporarily unavailable
- **Completed:** Closed, results available for analysis

## 🎭 Understanding Blind Testing

### **What Participants See:**
- Model names as **Alpha, Beta, Gamma**
- No indication of real AI provider
- Clean, unbiased interface

### **What You See (Admin):**
- Real model names in admin interface
- Blind name assignments in preview
- Full model configuration details

### **Why Blind Testing Matters:**
- Prevents bias toward/against specific companies
- Ensures objective evaluation of AI responses
- Maintains scientific integrity of testing
- Enables fair comparison between models

## 🔧 Model Management

### **Testing Model Connections**
1. Go to **Admin Dashboard** → **"Manage Models"**
2. Click **"Test Connection"** for each model
3. Green checkmark = Working
4. Red X = Configuration issue

**Common Issues:**
- Missing API keys in environment variables
- Incorrect model IDs
- Rate limiting or quota exceeded
- Network connectivity problems

### **Adding New Models**
1. Navigate to **"Manage Models"**
2. Click **"Add New Model"**
3. Configure:
   - **Name:** Display name for admin
   - **Provider:** google, openai, anthropic, groq, custom
   - **Model ID:** API-specific model identifier
   - **Capabilities:** text_generation, image_generation, etc.

## 📊 Monitoring Exercises

### **Exercise Dashboard**
- **Participant Count:** Current vs. maximum
- **Status:** Active, paused, completed
- **Start/End Dates:** Exercise timeline
- **Model Assignments:** Which models are being tested

### **Participant Management**
- View who has joined exercises
- Monitor participation levels
- Track completion rates

## 🚩 Flagging System Overview

### **How Flagging Works:**
1. Participants flag problematic AI responses
2. Flags include conversation context
3. Categories: bias, misinformation, harmful content, etc.
4. Severity ratings from 1-10
5. Comments explaining the issue

### **Reviewing Flags:**
1. Access flagged content from admin dashboard
2. Review full conversation context
3. Analyze patterns across models
4. Export data for further analysis

**Flag Categories:**
- **Harmful Content:** Violence, self-harm, illegal activities
- **Misinformation:** False or misleading information
- **Bias/Discrimination:** Unfair treatment of groups
- **Privacy Violation:** Inappropriate personal data requests
- **Inappropriate Response:** Off-topic or unprofessional
- **Factual Error:** Incorrect information
- **Off-Topic Response:** Not addressing the prompt

## 📱 Mobile Considerations

### **Mobile-Optimized Interface:**
- Responsive design works on all devices
- Touch-friendly buttons and controls
- Proper text sizing without zoom
- Scroll isolation for chat areas

### **Mobile Testing Tips:**
- Test exercises on mobile devices
- Ensure guidelines are readable on small screens
- Verify chat interface works with touch
- Check that flagging system is accessible

## 🔒 Security & Privacy

### **Data Protection:**
- All conversations stored securely
- Blind testing maintains model anonymity
- User data protected with RLS policies
- API keys secured in environment variables

### **Best Practices:**
- Regular security updates
- Monitor for suspicious activity
- Backup exercise data regularly
- Review flagged content promptly

## 📈 Analytics & Reporting

### **Available Metrics:**
- Participation rates by exercise
- Flag submission patterns
- Model performance comparisons (blind)
- User engagement statistics

### **Data Export:**
- Exercise results in CSV/JSON format
- Flagged content reports
- Participation analytics
- Model comparison data

## 🆘 Troubleshooting

### **Common Issues:**

**"No AI Models Available"**
- Check model configuration in admin panel
- Verify API keys are set correctly
- Test model connections

**"Exercise Not Visible to Participants"**
- Ensure status is set to "Active"
- Check start date hasn't passed
- Verify participant limits not exceeded

**"AI Responses Not Working"**
- Test individual model connections
- Check API key validity and quotas
- Review error logs in admin panel

**"Blind Names Not Showing"**
- Verify models are assigned to exercise
- Check junction table data integrity
- Refresh exercise page

### **Getting Help:**
- Check system status at admin dashboard
- Review error logs for technical issues
- Contact technical support for persistent problems

## ✅ Exercise Creation Checklist

### **Before Publishing:**
- [ ] Exercise title and description complete
- [ ] Appropriate difficulty level selected
- [ ] Clear, comprehensive guidelines written
- [ ] AI models selected and tested
- [ ] Blind name assignments verified
- [ ] Start/end dates configured (if needed)
- [ ] Participant limits set (if needed)
- [ ] Exercise status set to "Active"

### **After Publishing:**
- [ ] Test exercise as a participant
- [ ] Verify AI responses are working
- [ ] Check blind names display correctly
- [ ] Monitor initial participation
- [ ] Review any early flags submitted

---

## 🎯 Best Practices

### **Exercise Design:**
- **Clear Objectives:** Define what you're testing
- **Specific Guidelines:** Give participants clear direction
- **Appropriate Models:** Choose models relevant to your testing goals
- **Reasonable Scope:** Don't make exercises too broad or complex

### **Model Selection:**
- **Single Model:** For focused, deep testing
- **Two Models:** For direct comparison
- **Three+ Models:** For comprehensive analysis
- **Mix Providers:** Test different AI approaches

### **Guidelines Writing:**
- **Be Specific:** Exact prompts and scenarios
- **Include Examples:** Show what good/bad responses look like
- **Set Expectations:** How long should participants spend?
- **Explain Flagging:** When and how to report issues

---

*Admin Guide: Creating AI Exercises - User Documentation*  
*Week 7-8 AI Integration Complete*
