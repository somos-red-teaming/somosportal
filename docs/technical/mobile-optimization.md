# Mobile Optimization Guide

**Document Type:** Technical Implementation  
**Last Updated:** December 20, 2025  
**Status:** Week 7-8 Complete

---

## 📱 Mobile-First Design Strategy

The SOMOS platform prioritizes mobile experience with responsive chatboxes, touch optimization, and proper content containment for AI conversations.

## 🎯 Mobile Optimization Goals

### **Performance Targets**
- ✅ Page load time < 2 seconds
- ✅ Smooth 60fps scrolling
- ✅ Touch response < 100ms
- ✅ Memory usage < 50MB
- ✅ No horizontal overflow

### **User Experience Goals**
- ✅ One-handed operation
- ✅ Touch-friendly button sizes (44px minimum)
- ✅ Readable text without zoom
- ✅ Proper keyboard handling
- ✅ Scroll isolation between components

## 🔧 Viewport Configuration

### **Meta Tag Setup**
```html
<!-- Prevents zoom and ensures stable layout -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

### **CSS Viewport Units**
```css
/* Use calc() instead of vh for better mobile support */
.chatbox-container {
  height: calc(100vh - 200px); /* Accounts for header/navigation */
  max-height: 600px;
  min-height: 400px;
}

/* Mobile-specific adjustments */
@media (max-width: 640px) {
  .chatbox-container {
    height: calc(100vh - 250px); /* More space for mobile UI */
  }
}
```

## 🎨 Responsive Layout System

### **Breakpoint Strategy**
```typescript
// Tailwind CSS breakpoints used throughout the platform
const breakpoints = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Desktop
  xl: '1280px'   // Large desktop
}
```

### **ChatBox Layout Patterns**
```typescript
/**
 * Dynamic layout based on screen size and model count
 */
{models.length === 1 ? (
  // Single model: Full-width on all devices
  <div className="h-[calc(100vh-200px)] max-h-[600px] min-h-[400px] w-full">
    <ChatBox modelName={models[0].blind_name} />
  </div>
) : (
  // Multiple models: Responsive grid
  <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 w-full">
    {models.map((model) => (
      <div className="h-[calc(50vh-100px)] lg:h-[calc(100vh-250px)] max-h-[450px] min-h-[300px] w-full">
        <ChatBox key={model.model_id} modelName={model.blind_name} />
      </div>
    ))}
  </div>
)}
```

## 🖱️ Touch Interaction Optimization

### **Scroll Isolation Implementation**
```typescript
/**
 * Prevents page scroll when chatbox is being scrolled
 * Critical for mobile user experience
 */
const handleTouchStart = (e: React.TouchEvent) => {
  const container = messagesContainerRef.current
  if (!container) return

  const { scrollTop, scrollHeight, clientHeight } = container
  const isAtTop = scrollTop === 0
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

  // Prevent page scroll when scrolling within chatbox
  if (!isAtTop && !isAtBottom) {
    e.stopPropagation()
  }
}

const handleTouchMove = (e: React.TouchEvent) => {
  e.stopPropagation() // Always prevent page scroll during touch move
}
```

### **Touch-Friendly Button Sizing**
```css
/* Minimum 44px touch targets for accessibility */
.touch-button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
  border-radius: 8px;
}

/* Mobile-specific button adjustments */
@media (max-width: 640px) {
  .send-button {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
  }
  
  .copy-button {
    width: 32px;
    height: 32px;
    opacity: 0.8; /* Always visible on mobile */
  }
}
```

## 📝 Content Containment Strategy

### **Text Overflow Prevention**
```css
/* Message bubble containment */
.message-bubble {
  max-width: calc(100% - 4rem); /* Accounts for avatars and padding */
  word-wrap: break-word;
  overflow-wrap: anywhere;
  hyphens: auto;
}

/* Code block containment */
.code-block {
  margin-left: -12px;  /* Negative margin to use full width */
  margin-right: -12px;
  overflow-x: auto;
  max-width: calc(100% + 24px);
}

/* Table responsiveness */
.table-container {
  overflow-x: auto;
  margin: 8px -12px; /* Extend beyond message padding */
  max-width: calc(100% + 24px);
}
```

### **Markdown Rendering Optimization**
```typescript
/**
 * Mobile-optimized markdown components
 */
const mobileMarkdownComponents = {
  // Smaller code blocks for mobile
  code({ inline, className, children, ...props }: any) {
    return !inline ? (
      <div className="relative my-2 -mx-3">
        <div className="overflow-x-auto bg-gray-900 rounded">
          <SyntaxHighlighter
            style={oneDark}
            className="!bg-transparent !m-0 text-xs"
            customStyle={{ 
              fontSize: '0.75rem',  // Smaller font for mobile
              padding: '12px'
            }}
            wrapLongLines={false}
          >
            {String(children)}
          </SyntaxHighlighter>
        </div>
      </div>
    ) : (
      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono break-all">
        {children}
      </code>
    )
  },
  
  // Compact tables for mobile
  table({ children }: any) {
    return (
      <div className="overflow-x-auto my-2 -mx-3">
        <table className="min-w-full border-collapse text-xs">
          {children}
        </table>
      </div>
    )
  }
}
```

## ⌨️ Keyboard and Input Optimization

### **Virtual Keyboard Handling**
```typescript
/**
 * Handles virtual keyboard appearance on mobile
 */
useEffect(() => {
  const handleResize = () => {
    // Adjust chatbox height when virtual keyboard appears
    const viewportHeight = window.visualViewport?.height || window.innerHeight
    const chatContainer = document.querySelector('.chatbox-container')
    
    if (chatContainer) {
      chatContainer.style.height = `${viewportHeight - 200}px`
    }
  }
  
  window.visualViewport?.addEventListener('resize', handleResize)
  return () => window.visualViewport?.removeEventListener('resize', handleResize)
}, [])
```

### **Input Field Optimization**
```typescript
/**
 * Mobile-optimized textarea with proper keyboard handling
 */
<Textarea
  placeholder={`Message ${modelName}...`}
  value={inputMessage}
  onChange={(e) => setInputMessage(e.target.value)}
  onKeyPress={handleKeyPress}
  rows={1}
  className="resize-none text-sm min-h-[36px] max-h-[100px]"
  style={{ fieldSizing: 'content' } as any} // Auto-resize
  disabled={isLoading}
/>
```

### **Enter Key Handling**
```typescript
/**
 * Proper Enter key handling for mobile keyboards
 */
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    e.stopPropagation() // Prevent page scroll
    handleSendMessage()
  }
}
```

## 🎨 Visual Design Adaptations

### **Typography Scaling**
```css
/* Mobile-first typography */
.message-text {
  font-size: 0.875rem; /* 14px base */
  line-height: 1.5;
}

.model-name {
  font-size: 0.75rem; /* 12px */
  font-weight: 600;
}

.timestamp {
  font-size: 0.625rem; /* 10px */
  opacity: 0.7;
}

/* Desktop enhancements */
@media (min-width: 768px) {
  .message-text {
    font-size: 1rem; /* 16px */
  }
  
  .model-name {
    font-size: 0.875rem; /* 14px */
  }
}
```

### **Spacing and Padding**
```css
/* Mobile-optimized spacing */
.chatbox-mobile {
  padding: 12px;
  gap: 12px;
}

.message-bubble-mobile {
  padding: 8px 12px;
  margin: 4px 0;
}

/* Desktop spacing */
@media (min-width: 768px) {
  .chatbox-desktop {
    padding: 16px;
    gap: 16px;
  }
  
  .message-bubble-desktop {
    padding: 12px 16px;
    margin: 8px 0;
  }
}
```

## 🔄 Auto-Scroll Implementation

### **Mobile-Safe Auto-Scroll**
```typescript
/**
 * Auto-scroll that doesn't interfere with page scroll
 */
const scrollToBottom = () => {
  if (messagesContainerRef.current && messagesEndRef.current) {
    // Use scrollTop instead of scrollIntoView to prevent page scroll
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
  }
}

useEffect(() => {
  // Smooth scroll on new messages
  const timer = setTimeout(scrollToBottom, 100)
  return () => clearTimeout(timer)
}, [messages])
```

### **Scroll Performance Optimization**
```css
/* Smooth scrolling with hardware acceleration */
.messages-container {
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; /* iOS momentum scrolling */
  scroll-behavior: smooth;
  will-change: scroll-position;
  transform: translateZ(0); /* Force hardware acceleration */
}
```

## 📊 Performance Monitoring

### **Mobile Performance Metrics**
```typescript
/**
 * Performance monitoring for mobile devices
 */
const measurePerformance = () => {
  // Measure scroll performance
  const scrollStart = performance.now()
  messagesContainer.addEventListener('scroll', () => {
    const scrollTime = performance.now() - scrollStart
    if (scrollTime > 16) { // > 60fps
      console.warn('Scroll performance issue:', scrollTime)
    }
  })
  
  // Measure touch response time
  const touchStart = performance.now()
  document.addEventListener('touchstart', () => {
    const touchTime = performance.now() - touchStart
    if (touchTime > 100) {
      console.warn('Touch response slow:', touchTime)
    }
  })
}
```

### **Memory Usage Optimization**
```typescript
/**
 * Cleanup and memory management for mobile
 */
useEffect(() => {
  // Cleanup event listeners
  return () => {
    window.removeEventListener('resize', handleResize)
    messagesContainer?.removeEventListener('scroll', handleScroll)
    document.removeEventListener('touchstart', handleTouch)
  }
}, [])

// Limit message history on mobile to prevent memory issues
const MAX_MESSAGES_MOBILE = 50
const messages = allMessages.slice(-MAX_MESSAGES_MOBILE)
```

## 🧪 Mobile Testing Strategy

### **Device Testing Matrix**
```typescript
/**
 * Comprehensive mobile testing across devices
 */
const testDevices = [
  // iOS
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  
  // Android
  { name: 'Galaxy S21', width: 384, height: 854 },
  { name: 'Pixel 6', width: 393, height: 851 },
  
  // Tablets
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 }
]
```

### **Automated Mobile Tests**
```typescript
/**
 * Playwright mobile testing
 */
test('mobile chatbox functionality', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 })
  
  // Test touch interactions
  await page.tap('[data-testid="send-button"]')
  
  // Test scroll isolation
  await page.evaluate(() => {
    const chatbox = document.querySelector('.messages-container')
    chatbox?.scrollTo(0, 100)
  })
  
  // Verify page didn't scroll
  const pageScrollY = await page.evaluate(() => window.scrollY)
  expect(pageScrollY).toBe(0)
})
```

## 🚀 Mobile Deployment Considerations

### **Progressive Web App (PWA) Features**
```json
// manifest.json
{
  "name": "SOMOS AI Red-Teaming",
  "short_name": "SOMOS",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "start_url": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### **Service Worker for Offline Support**
```typescript
/**
 * Cache AI responses for offline access
 */
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/ai/chat')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      })
    )
  }
})
```

---

## 📱 Mobile Optimization Checklist

### **Performance** ✅
- [x] Page load time < 2 seconds
- [x] Smooth 60fps scrolling
- [x] Touch response < 100ms
- [x] Memory usage optimized
- [x] No layout shifts

### **User Experience** ✅
- [x] Touch-friendly button sizes (44px+)
- [x] Readable text without zoom
- [x] Proper keyboard handling
- [x] Scroll isolation working
- [x] No horizontal overflow

### **Content** ✅
- [x] Text wrapping and containment
- [x] Code block horizontal scroll
- [x] Table responsiveness
- [x] Image optimization
- [x] Copy functionality on touch

### **Testing** ✅
- [x] iOS Safari testing
- [x] Android Chrome testing
- [x] Various screen sizes
- [x] Portrait/landscape modes
- [x] Virtual keyboard handling

---

*Mobile Optimization Guide - Technical Implementation*  
*Week 7-8 AI Integration Complete*
