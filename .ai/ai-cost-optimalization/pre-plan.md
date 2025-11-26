# AI Cost Optimization - Pre-Plan Document

## Purpose

This document serves as a pre-planning resource for implementing AI cost optimization in the Diet Planner application. It contains:

1. **Research findings** on existing AI cost optimization strategies
2. **Current implementation analysis** with token usage patterns and cost estimates
3. **Instructions for the implementation agent** to guide plan creation through iterative questioning

The agent using this document should review the research, sketch architectural suggestions, ask adaptive questions in rounds of 5, and then create a comprehensive implementation plan.

---

## Part 1: Research on AI Cost Optimization Strategies

### 1.1 Context Window Optimization Strategies

#### Context Caching
- **Strategy**: Store and reuse previous AI responses in multi-turn conversations to avoid resending identical context
- **Impact**: Can reduce costs by up to 90% in multi-turn responses (Onuro.ai)
- **Applicability**: Highly relevant for chat sessions where the same system prompt is sent repeatedly
- **Implementation Complexity**: Medium - requires caching infrastructure
- **Reference**: [Onuro.ai Cost Optimization](https://www.onuro.ai/docs/pricing/usage-based/cost-optimization)

#### Sliding Window Message Truncation
- **Strategy**: Maintain only the most recent N interactions in conversation history, discarding older messages
- **Impact**: Directly reduces context size linearly with conversation length
- **Applicability**: Very relevant - current implementation sends full message history
- **Implementation Complexity**: Low - simple array slicing logic
- **Reference**: [Onuro.ai Cost Optimization](https://www.onuro.ai/docs/pricing/usage-based/cost-optimization)

#### Dynamic Content Truncation
- **Strategy**: Identify and remove parts of context that are no longer relevant (outdated file states, irrelevant conversation history)
- **Impact**: Reduces context size while maintaining relevance
- **Applicability**: Relevant for edit mode where old plan versions may be irrelevant
- **Implementation Complexity**: High - requires semantic analysis or heuristics
- **Reference**: [Onuro.ai Cost Optimization](https://www.onuro.ai/docs/pricing/usage-based/cost-optimization)

#### Selective Context Inclusion (RAG)
- **Strategy**: Use retrieval-augmented generation to include only relevant portions of documents/conversation history
- **Impact**: Can reduce context-related token usage by up to 70% (Koombea)
- **Applicability**: Medium - may be overkill for current use case but useful for future enhancements
- **Implementation Complexity**: High - requires vector database and embedding models
- **Reference**: [Koombea LLM Cost Optimization](https://ai.koombea.com/blog/llm-cost-optimization)

### 1.2 Prompt Optimization Strategies

#### Prompt Compression (LLMLingua)
- **Strategy**: Use specialized tools to compress prompts while maintaining essential information
- **Impact**: Can achieve up to 20x compression with minimal performance loss (Medium)
- **Applicability**: Highly relevant - system prompts are ~500-800 tokens and could be compressed
- **Implementation Complexity**: Medium - requires integration with compression library
- **Reference**: [Advanced Strategies to Optimize LLM Costs](https://medium.com/@giuseppetrisciuoglio/advanced-strategies-to-optimize-large-language-model-costs-351c6777afbc)

#### Prompt Engineering
- **Strategy**: Craft concise, clear prompts that eliminate unnecessary tokens while maintaining output quality
- **Impact**: Can lower token usage by up to 35% (Uptech)
- **Applicability**: Very relevant - current prompts have verbose JSON structure examples
- **Implementation Complexity**: Low - requires prompt rewriting and testing
- **Reference**: [How to Reduce LLM Costs](https://www.uptech.team/blog/how-to-reduce-llm-costs)

#### Smart Context Management
- **Strategy**: Two-tier approach using economical models for initial evaluations, powerful models for filtered/compressed contexts
- **Components**:
  - ReRankingContentAggregator: Reorders contextual search results by relevance
  - CompressingQueryTransformer: Compresses queries before processing
- **Impact**: Substantial cost reductions through tiered processing
- **Applicability**: Medium - could be applied to edit mode where initial analysis could use cheaper models
- **Implementation Complexity**: High - requires multiple model coordination
- **Reference**: [Advanced Strategies to Optimize LLM Costs](https://medium.com/@giuseppetrisciuoglio/advanced-strategies-to-optimize-large-language-model-costs-351c6777afbc)

### 1.3 Model Selection Strategies

#### Tiered Model Approach
- **Strategy**: Categorize tasks by complexity and assign appropriate models:
  - **Tier 1 (Simple)**: Small, cost-effective models for classification, formatting, basic edits
  - **Tier 2 (Moderate)**: Mid-tier models for summarization, straightforward Q&A, template-based generation
  - **Tier 3 (Complex)**: Advanced models for complex reasoning, creative generation, initial plan creation
- **Impact**: Can reduce AI costs by up to 64% compared to using a single high-cost model (Mixflow.ai)
- **Applicability**: Highly relevant - initial plan generation needs reasoning, edits need simple models
- **Implementation Complexity**: Medium - requires task classification logic
- **Reference**: [AI Model Routing Strategies](https://mixflow.ai/blog/ai-model-routing-h2-2025-7-strategies-to-slash-costs-and-boost-performance/)

#### Cascading Model Approach
- **Strategy**: Start with cheaper models and escalate to more sophisticated models only when necessary (based on confidence scoring or failure detection)
- **Impact**: Resolves majority of cases at lower cost tier while maintaining quality
- **Applicability**: Medium - could be used for edit requests where simple changes might not need reasoning models
- **Implementation Complexity**: High - requires confidence scoring and fallback logic
- **Reference**: [LLM Cost Reduction Strategies](https://mljourney.com/llm-cost-reduction-strategies-practical-techniques-to-slash-your-ai-spending/)

#### Dynamic Model Routing
- **Strategy**: Automatically select AI models based on task complexity assessment
- **Impact**: Significant cost reductions without compromising performance
- **Applicability**: Very relevant - different operations have different complexity requirements
- **Implementation Complexity**: Medium - requires task analysis and routing logic
- **Reference**: [Scaling AI Best Practices](https://getstream.io/blog/scaling-ai-best-practices/)

#### Hybrid Edge-Cloud Resource Allocation
- **Strategy**: Allocate tasks between local small language models (SLMs) and cloud-based LLMs
- **Impact**: Optimizes cost and performance through strategic allocation
- **Applicability**: Low - current architecture uses cloud-based OpenRouter exclusively
- **Implementation Complexity**: Very High - requires local model infrastructure
- **Reference**: [Hybrid Edge-Cloud Resource Allocation](https://arxiv.org/abs/2504.00434)

### 1.4 Cost-Aware Model Selection Algorithms

#### PromptWise Framework
- **Strategy**: Online learning framework that assigns prompts to models based on cost and performance considerations, querying cheaper models first
- **Impact**: Significant cost savings through strategic model selection
- **Applicability**: Medium - could be adapted for task-based routing
- **Implementation Complexity**: High - requires learning framework
- **Reference**: [PromptWise Research](https://arxiv.org/abs/2505.18901)

---

## Part 2: Current Implementation Analysis

### 2.1 Current Architecture Overview

The Diet Planner application uses:
- **AI Provider**: OpenRouter.ai (access to multiple models)
- **Session Management**: Full message history stored in database, sent with each request
- **Model Selection**: Single user preference model used for all operations
- **Operations**: 
  - `createSession`: Initial meal plan generation (single-day or multi-day)
  - `sendMessage`: Follow-up messages for edits and refinements

### 2.2 Token Usage Analysis

#### System Prompt Size
- **Single-day (English)**: ~800 tokens
- **Single-day (Polish)**: ~900 tokens
- **Multi-day (English)**: ~1,000 tokens
- **Multi-day (Polish)**: ~1,100 tokens

**Key Components**:
- Role definition: ~50 tokens
- JSON structure examples: ~400-500 tokens (largest component)
- Requirements list: ~200-300 tokens
- Instructions: ~100-200 tokens

**Optimization Potential**: JSON structure examples could be compressed or moved to external schema reference.

#### User Prompt Size
- **Typical single-day**: ~200-400 tokens (depends on exclusions_guidelines length)
- **Typical multi-day**: ~300-600 tokens
- **With long guidelines**: Can exceed 1,000 tokens

**Components**:
- Patient demographics: ~50-100 tokens
- Nutritional targets: ~50-100 tokens
- Exclusions/guidelines: Variable (can be very long)
- Multi-day options: ~50-100 tokens

**Optimization Potential**: Guidelines could be summarized or truncated if too long.

#### Message History Growth
- **Initial session**: 3 messages (system, user, assistant) = ~1,500-2,500 tokens
- **After 1 edit**: 5 messages = ~2,500-4,000 tokens
- **After 5 edits**: 11 messages = ~5,000-8,000 tokens
- **After 10 edits**: 21 messages = ~10,000-15,000 tokens

**Current Behavior**: Full history sent with every request, growing linearly.

**Optimization Potential**: 
- Sliding window: Keep only last 5-10 messages
- Summarization: Summarize older messages
- Context caching: Cache system prompt (not resent if unchanged)

### 2.3 Cost Estimates

#### Current Model Pricing (from `models.config.ts`)
- **Cheapest**: `google/gemini-2.5-flash-lite` - $0.34 per 1M tokens (combined)
- **Default**: `openai/gpt-4.1-nano` - $0.34 per 1M tokens (combined)
- **Mid-range**: `openai/gpt-4o-mini` - $2.04 per 1M tokens (combined)
- **Expensive**: `anthropic/claude-sonnet-4.5` - $12.60 per 1M tokens (combined)

#### Typical Session Costs (Current)
**Scenario 1: Single-day plan, 3 interactions**
- Input: ~3,000 tokens
- Output: ~2,000 tokens
- Total: ~5,000 tokens
- Cost (default model): ~$0.0017
- Cost (expensive model): ~$0.063

**Scenario 2: Multi-day plan, 5 interactions**
- Input: ~8,000 tokens
- Output: ~5,000 tokens
- Total: ~13,000 tokens
- Cost (default model): ~$0.0044
- Cost (expensive model): ~$0.164

**Scenario 3: Edit session, 10 interactions**
- Input: ~15,000 tokens (full history)
- Output: ~8,000 tokens
- Total: ~23,000 tokens
- Cost (default model): ~$0.0078
- Cost (expensive model): ~$0.290

#### Potential Savings with Optimization

**With sliding window (keep last 5 messages)**:
- Edit session input: ~8,000 tokens (instead of 15,000)
- Savings: ~47% on input tokens

**With model tiering (reasoning model for initial, cheap for edits)**:
- Initial generation: Use expensive model ($0.063)
- 5 edits: Use cheap model (5 × $0.0017 = $0.0085)
- Total: $0.0715 (vs $0.164 with expensive model throughout)
- Savings: ~56%

**With prompt compression (20% reduction)**:
- System prompt: ~640 tokens (instead of 800)
- Savings: ~20% on system prompt tokens

**Combined optimization potential**: 60-70% cost reduction for typical usage patterns.

### 2.4 Current Task Types and Complexity

#### Task Classification

**High Complexity (Requires Reasoning Models)**:
- Initial meal plan generation (single-day)
- Initial multi-day meal plan generation
- Major plan restructuring (e.g., "change all meals to vegetarian")
- Complex nutritional recalculation requests

**Medium Complexity (Could Use Mid-Tier Models)**:
- Adding a new meal to existing plan
- Modifying macro distribution
- Adjusting portion sizes across meals

**Low Complexity (Can Use Cheap Models)**:
- Text corrections ("fix typo in meal name")
- Formatting requests ("make ingredients list shorter")
- Simple substitutions ("replace chicken with turkey")
- Minor edits to preparation instructions

**Current Limitation**: All tasks use the same model regardless of complexity.

---

## Part 3: Instructions for Implementation Agent

### 3.1 Document Review Process

1. **Read and understand**:
   - Part 1: Research findings on optimization strategies
   - Part 2: Current implementation analysis
   - This section: Instructions for plan creation

2. **Identify applicable strategies**:
   - Which strategies from Part 1 are most relevant to the Diet Planner use case?
   - Which strategies offer the best cost/benefit ratio?
   - Which strategies can be implemented with reasonable complexity?

3. **Analyze current implementation**:
   - Review the codebase structure (referenced in Part 2)
   - Understand the current AI service architecture
   - Identify integration points for optimizations

### 3.2 Architectural Suggestions Phase

After reviewing the research and current implementation, sketch **high-level architectural approaches** for implementing cost optimization. Consider:

1. **Context Management Architecture**:
   - How to implement sliding window truncation
   - Where to add context summarization logic
   - How to cache system prompts

2. **Model Selection Architecture**:
   - Task classification system design
   - Model routing logic structure
   - Fallback mechanisms for model failures

3. **Integration Points**:
   - Where to inject optimization logic in current codebase
   - How to maintain backward compatibility (note: user said no backward compatibility needed)
   - Database schema changes if needed

4. **Configuration Management**:
   - How to configure model tiers
   - How to configure context window sizes
   - How to make optimizations tunable

Present these as **high-level architectural suggestions** (not detailed implementation), focusing on:
- Component structure
- Data flow
- Key decision points
- Trade-offs

### 3.3 Iterative Questioning Process

After presenting architectural suggestions, engage in **adaptive questioning** to gather requirements. Follow this process:

#### Question Round Structure
- Present **exactly 5 questions** per round
- Questions should be **adaptive** based on previous answers
- Questions should help clarify:
  - Implementation priorities
  - Technical constraints
  - User experience requirements
  - Performance requirements
  - Integration preferences

#### Question Categories to Explore

1. **Priority and Scope**:
   - Which optimizations should be implemented first?
   - Are there any optimizations to avoid?
   - What's the acceptable implementation complexity?

2. **Model Selection Strategy**:
   - How should task complexity be determined?
   - Should model selection be automatic or configurable?
   - What fallback behavior is acceptable?

3. **Context Management**:
   - What's the acceptable context window size?
   - Should summarization be used or just truncation?
   - How to handle edit mode context?

4. **User Experience**:
   - Should users be aware of model selection?
   - Should there be user controls for optimization?
   - How to handle quality differences between models?

5. **Technical Implementation**:
   - Preferred integration approach (service layer, middleware, etc.)?
   - Database schema changes acceptable?
   - Performance requirements?

#### Questioning Protocol
1. Present 5 questions
2. Wait for user responses
3. Analyze responses and adapt next round
4. Continue until user says "stop" or indicates readiness to proceed
5. Then move to plan creation

### 3.4 Implementation Plan Creation

After gathering sufficient information through questioning, create a comprehensive implementation plan following the Diet Planner feature plan template structure:

1. **Overview**: Feature description and purpose
2. **Architecture**: Component structure and data flow
3. **Implementation Steps**: Detailed, sequential steps
4. **Types**: TypeScript types and interfaces
5. **API Changes**: Any API modifications needed
6. **Database Changes**: Schema modifications if required
7. **Testing Strategy**: How to validate optimizations
8. **Migration Path**: How to transition from current to optimized implementation

The plan should be:
- **Actionable**: Clear steps that can be executed
- **Specific**: References to actual files and code locations
- **Comprehensive**: Covers all aspects of the optimization feature
- **Aligned with research**: Incorporates applicable strategies from Part 1

---

## Part 4: Key Files and Code References

### Current AI Implementation Files

**Core Services**:
- `src/lib/ai/session.service.ts` - Session creation and message sending
- `src/lib/ai/openrouter.service.ts` - OpenRouter API client
- `src/lib/ai/models.config.ts` - Available models and pricing

**API Endpoints**:
- `src/pages/api/ai/sessions.ts` - Create session endpoint
- `src/pages/api/ai/sessions/[id]/message.ts` - Send message endpoint

**Frontend Components**:
- `src/components/AIChatInterface.tsx` - Main chat interface
- `src/lib/api/ai-chat.client.ts` - Frontend API client

**User Preferences**:
- `src/lib/user-preferences/user-preference.service.ts` - Model preference management
- `src/pages/api/user-preferences/index.ts` - Preferences API

### Key Functions to Understand

1. **`createSession()`** in `session.service.ts`:
   - Creates new AI session
   - Formats system and user prompts
   - Sends to OpenRouter
   - Stores full message history

2. **`sendMessage()`** in `session.service.ts`:
   - Retrieves full message history
   - Appends new user message
   - Sends entire history to OpenRouter
   - Updates database with new history

3. **`convertHistoryForOpenRouter()`** in `session.service.ts`:
   - Converts database message format to OpenRouter format
   - Handles [SYSTEM] prefix conversion

4. **`formatSystemPrompt()`** in `session.service.ts`:
   - Generates system prompt with JSON structure
   - ~800-1,100 tokens depending on language and plan type

5. **`formatUserPrompt()`** in `session.service.ts`:
   - Formats patient data into user prompt
   - ~200-1,000 tokens depending on data completeness

### Current Message Flow

```
User Action → Frontend → API Endpoint → Session Service → OpenRouter Service → OpenRouter API
                                                              ↓
                                                         Response
                                                              ↓
User Action ← Frontend ← API Endpoint ← Session Service ← Database Update
```

**Key Points**:
- Full message history retrieved from database
- Full history sent to OpenRouter
- Single model used for all operations
- No context optimization applied

---

## Part 5: Research Summary for Quick Reference

### Top Optimization Strategies (Ranked by Applicability)

1. **Sliding Window Truncation** ⭐⭐⭐⭐⭐
   - High impact, low complexity
   - Directly addresses message history growth
   - Easy to implement

2. **Model Tiering** ⭐⭐⭐⭐⭐
   - High impact, medium complexity
   - Addresses core cost issue (using expensive models for simple tasks)
   - Requires task classification logic

3. **Prompt Compression** ⭐⭐⭐⭐
   - Medium-high impact, medium complexity
   - Reduces system prompt size
   - Requires testing to ensure quality maintained

4. **Context Caching** ⭐⭐⭐
   - Medium impact, medium complexity
   - Useful for system prompt reuse
   - Requires caching infrastructure

5. **Dynamic Content Truncation** ⭐⭐
   - Medium impact, high complexity
   - Requires semantic analysis
   - May be overkill for current use case

### Cost Reduction Potential

- **Sliding Window**: 30-50% reduction in input tokens for long sessions
- **Model Tiering**: 50-70% reduction in overall costs (using cheap models for edits)
- **Prompt Compression**: 15-25% reduction in system prompt tokens
- **Combined**: 60-75% cost reduction for typical usage

### Implementation Complexity

- **Low**: Prompt engineering, sliding window
- **Medium**: Model tiering, prompt compression, context caching
- **High**: Dynamic truncation, RAG, cascading models

---

## Part 6: Questions to Consider During Planning

These questions should guide the agent's thinking and be explored during the questioning phase:

1. **Task Classification**:
   - How to automatically determine if a request is "simple edit" vs "complex reasoning"?
   - Should classification be rule-based, ML-based, or hybrid?
   - What happens if classification is wrong?

2. **Context Window Management**:
   - What's the optimal window size? (e.g., last 5, 10, or 20 messages)
   - Should window size be configurable?
   - How to handle edit mode where old plan context might be needed?

3. **Model Selection**:
   - Which models should be in each tier?
   - Should tier assignment be configurable per user?
   - How to handle model unavailability?

4. **Quality Assurance**:
   - How to ensure cheap models produce acceptable quality?
   - Should there be quality monitoring?
   - What's the fallback if cheap model fails?

5. **User Experience**:
   - Should users know which model is being used?
   - Should there be quality/price trade-off options?
   - How to handle slower responses from cheaper models?

6. **Performance**:
   - Are there latency requirements?
   - Should optimizations be synchronous or async?
   - How to handle caching performance?

---

## Conclusion

This pre-plan document provides:
- Comprehensive research on AI cost optimization strategies
- Detailed analysis of current implementation
- Clear instructions for the implementation agent
- Key files and code references
- Research summary for quick reference

The agent should use this document to:
1. Understand the optimization landscape
2. Analyze the current implementation
3. Sketch architectural suggestions
4. Ask adaptive questions in rounds of 5
5. Create a comprehensive implementation plan

**Next Steps**: Agent should begin by reviewing this document, then proceed to the architectural suggestions phase, followed by iterative questioning.

