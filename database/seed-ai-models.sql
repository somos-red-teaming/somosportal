-- Seed default AI models for Week 7-8 AI Integration
-- These are the initial models we'll support

INSERT INTO public.ai_models (
    name, 
    display_name, 
    provider, 
    model_id, 
    description, 
    capabilities,
    is_active,
    is_public
) VALUES 
-- OpenAI Models
(
    'GPT-4', 
    'Model Alpha', 
    'openai', 
    'gpt-4', 
    'Advanced language model for text generation',
    ARRAY['text_generation', 'conversation', 'analysis'],
    true,
    true
),
(
    'DALL-E 3', 
    'Image Model Alpha', 
    'openai', 
    'dall-e-3', 
    'Advanced image generation model',
    ARRAY['image_generation', 'creative_art'],
    true,
    true
),

-- Anthropic Models  
(
    'Claude-3 Sonnet', 
    'Model Beta', 
    'anthropic', 
    'claude-3-sonnet-20240229', 
    'Balanced model for analysis and conversation',
    ARRAY['text_generation', 'analysis', 'reasoning'],
    true,
    true
),

-- Google Models
(
    'Gemini Pro', 
    'Model Gamma', 
    'google', 
    'gemini-pro', 
    'Google advanced language model',
    ARRAY['text_generation', 'multimodal', 'reasoning'],
    true,
    true
),
(
    'Nano Banana', 
    'Image Model Beta', 
    'google', 
    'gemini-pro-vision', 
    'Google image generation model (Nano Banana)',
    ARRAY['image_generation', 'vision', 'multimodal'],
    true,
    true
),

-- Custom/Placeholder Models
(
    'Custom Government Model', 
    'Model Delta', 
    'custom', 
    'gov-model-v1', 
    'Government-specific AI model',
    ARRAY['text_generation', 'policy_analysis'],
    false, -- Disabled until configured
    false  -- Private model
);
