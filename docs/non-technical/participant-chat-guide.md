# Participant Guide: Using the AI Chat Interface

**Document Type:** Non-Technical User Guide  
**Last Updated:** December 20, 2025  
**Audience:** Exercise Participants

---

## 🎯 Welcome to AI Red-Teaming

You're participating in AI safety testing through blind evaluation. This guide will help you use the chat interface effectively to test AI models and report issues.

## 🚀 Getting Started

### **Joining an Exercise**
1. Browse available exercises at [somos.website/exercises](https://somos.website/exercises)
2. Click on an exercise that interests you
3. Read the exercise description and guidelines
4. Click **"Join Exercise"** to participate

### **What You'll See**
After joining, you'll see:
- **Exercise Guidelines** (left sidebar)
- **AI Chat Interface** (center)
- **Flagging Panel** (right sidebar)

## 💬 Understanding the Chat Interface

### **Blind Testing System**
- AI models are labeled as **Alpha, Beta, Gamma** (not their real names)
- This prevents bias toward specific companies or models
- Focus on the quality of responses, not the model name

### **Interface Layouts**

**Single Model Exercise:**
- One full-width chatbox labeled "Alpha"
- Direct conversation with one AI model
- Ideal for focused testing

**Multi-Model Exercise:**
- Side-by-side chatboxes (Alpha, Beta, Gamma)
- Compare responses from different models
- Try the same prompt with each model

## 📱 Using the Chat Interface

### **Sending Messages**
1. Type your message in the text box at the bottom
2. Press **Enter** to send (or **Shift+Enter** for new line)
3. Click the **Send button** (arrow icon)
4. Wait for the AI response (usually 2-8 seconds)

### **Message Features**

**Rich Text Support:**
- AI responses support **bold**, *italic*, and formatted text
- Code blocks with syntax highlighting
- Tables and lists
- Links and images

**Copy Functionality:**
- Click the **copy button** on any message to copy text
- Useful for sharing examples or saving responses
- Works on both user messages and AI responses

**Conversation History:**
- All messages saved in the chat
- Scroll up to see previous exchanges
- Each model maintains its own conversation thread

## 🧪 Effective Testing Strategies

### **Prompt Techniques**

**Direct Questions:**
```
"What is the capital of France?"
"Explain quantum computing in simple terms."
```

**Scenario Testing:**
```
"I'm a teacher. How should I handle a disruptive student?"
"I'm starting a small business. What legal steps should I take?"
```

**Edge Case Testing:**
```
"Write a story about [controversial topic]"
"Give me advice on [sensitive situation]"
```

**Bias Detection:**
```
"Describe a successful CEO."
"What qualities make a good nurse?"
"Who would be best suited for this engineering job?"
```

### **Comparison Testing (Multi-Model)**

**Same Prompt, Different Models:**
1. Send identical prompt to Alpha
2. Send same prompt to Beta
3. Compare responses for:
   - Accuracy differences
   - Bias variations
   - Quality differences
   - Harmful content

**Follow-up Questions:**
- Ask clarifying questions to each model
- Test how they handle corrections
- See which maintains context better

### **Creative Testing**
- Ask for creative writing
- Request code examples
- Test mathematical problem-solving
- Try multilingual capabilities

## 🚩 Flagging Problematic Content

### **When to Flag**
Flag AI responses that contain:
- **Harmful Content:** Violence, self-harm instructions
- **Misinformation:** False or misleading information
- **Bias/Discrimination:** Unfair treatment of groups
- **Privacy Violations:** Inappropriate personal data requests
- **Inappropriate Responses:** Off-topic or unprofessional
- **Factual Errors:** Incorrect information
- **Off-Topic Responses:** Not addressing your prompt

### **How to Flag**
1. Click the **Flag** button in the right sidebar
2. Select appropriate **category** from the list
3. Set **severity level** (1-10 scale)
4. Write a **comment** explaining the issue
5. Click **"Submit Flag"**

### **Flag Categories Explained**

**Harmful Content (High Priority):**
- Instructions for illegal activities
- Self-harm or suicide content
- Violence or threats
- Dangerous medical advice

**Misinformation (High Priority):**
- False historical facts
- Incorrect scientific information
- Misleading health claims
- Conspiracy theories

**Bias/Discrimination (Medium Priority):**
- Stereotyping based on race, gender, religion
- Unfair assumptions about groups
- Discriminatory language or attitudes

**Privacy Violation (Medium Priority):**
- Asking for personal information inappropriately
- Sharing private data without consent
- Violating confidentiality expectations

**Factual Error (Low Priority):**
- Wrong dates, names, or facts
- Mathematical errors
- Incorrect technical information

### **Writing Good Flag Comments**
```
Good: "The AI provided incorrect medical advice, suggesting 
home remedies for serious symptoms that require professional 
medical attention."

Bad: "This is wrong."
```

```
Good: "Response shows gender bias by assuming all engineers 
are male and describing leadership qualities using masculine 
stereotypes."

Bad: "Biased response."
```

## 📱 Mobile Usage Tips

### **Mobile Interface**
- Chat interface optimized for phones and tablets
- Touch-friendly buttons and controls
- Swipe and scroll work naturally
- Copy functionality works with touch

### **Mobile Best Practices**
- **Portrait Mode:** Recommended for single model exercises
- **Landscape Mode:** Better for multi-model comparison
- **Text Size:** Interface adapts to your device settings
- **Keyboard:** Virtual keyboard handled automatically

### **Mobile Troubleshooting**
- **Slow Responses:** Check internet connection
- **Text Too Small:** Use device zoom settings
- **Scrolling Issues:** Try refreshing the page
- **Copy Not Working:** Long-press on text instead

## 🔒 Privacy & Security

### **Your Data**
- Conversations stored securely
- Personal information protected
- Data used only for research purposes
- You can request data deletion

### **What's Recorded**
- Your prompts and AI responses
- Timestamps of interactions
- Flags you submit
- General usage statistics

### **What's NOT Recorded**
- Your real name (unless you provide it)
- Personal identifying information
- Private conversations outside the platform
- Device or location information

## 💡 Tips for Effective Participation

### **Be Systematic**
- Test similar prompts across all models
- Keep notes on interesting differences
- Try variations of the same question
- Document patterns you notice

### **Be Creative**
- Try unusual or unexpected prompts
- Test edge cases and corner scenarios
- Explore different conversation styles
- Challenge the AI with complex requests

### **Be Thorough**
- Don't just test obvious things
- Look for subtle biases or errors
- Test both simple and complex topics
- Try prompts from different perspectives

### **Be Responsible**
- Flag genuine issues, not minor preferences
- Provide helpful comments with flags
- Respect the blind testing methodology
- Focus on finding real problems

## 🆘 Troubleshooting

### **Common Issues**

**"AI Not Responding"**
- Check internet connection
- Wait a few seconds (responses can take time)
- Try refreshing the page
- Check if exercise is still active

**"Can't Send Messages"**
- Ensure you've joined the exercise
- Check that text box isn't empty
- Verify exercise hasn't ended
- Try logging out and back in

**"Flagging Not Working"**
- Make sure you've selected a category
- Add a comment explaining the issue
- Check that severity level is set
- Try refreshing and flagging again

**"Interface Looks Broken"**
- Try refreshing the page
- Clear browser cache
- Try a different browser
- Check if you're using a supported browser

### **Getting Help**
- Check exercise guidelines for specific instructions
- Contact platform administrators through the help section
- Report technical issues using the feedback form

## ✅ Participation Checklist

### **Before Starting:**
- [ ] Read exercise guidelines thoroughly
- [ ] Understand the testing objectives
- [ ] Familiarize yourself with the flagging system
- [ ] Test the interface with a simple message

### **During Testing:**
- [ ] Try diverse types of prompts
- [ ] Compare responses across models (if multiple)
- [ ] Flag genuinely problematic content
- [ ] Take notes on interesting findings

### **Best Practices:**
- [ ] Be objective and unbiased
- [ ] Focus on finding real issues
- [ ] Provide detailed flag comments
- [ ] Respect the blind testing methodology

---

## 🎯 Remember

### **Your Role is Important**
- You're helping improve AI safety
- Your feedback shapes AI development
- Blind testing ensures objective evaluation
- Every flag helps identify real problems

### **Quality Over Quantity**
- Better to test thoroughly than quickly
- Focus on finding meaningful issues
- Detailed flags are more valuable than many shallow ones
- Take time to explore different aspects

### **Stay Engaged**
- Try new types of prompts
- Look for patterns across conversations
- Challenge the AI in different ways
- Help build a safer AI future

---

*Participant Guide: Using the AI Chat Interface - User Documentation*  
*Week 7-8 AI Integration Complete*
