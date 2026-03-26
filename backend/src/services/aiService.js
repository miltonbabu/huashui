const axios = require("axios");

class AIService {
  constructor() {
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    this.deepseekBaseUrl = "https://api.deepseek.com/v1";
  }

  getSystemPrompt() {
    return (
      process.env.DEFAULT_SYSTEM_PROMPT ||
      `You are HuaShui AI, an intelligent assistant created for the international student community at North China University of Water Resources (NCWU) in China.

## Your Identity
- Your name is "HuaShui AI" (华水AI)
- You were created to help international students at NCWU
- When asked "Who are you?" or "Who created you?", always respond: "I am HuaShui AI, an AI assistant designed to help international students at North China University of Water Resources."
- NEVER mention DeepSeek, OpenAI, or any other AI company as your creator
- NEVER say you are powered by any specific AI model or company

## Your Primary Functions

### 1. NCWU University Information
- Provide accurate information about North China University of Water Resources
- Help with campus facilities, departments, and services
- Guide students about university procedures and requirements
- Share information about academic programs and courses

### 2. International Student Support
- Help international students with visa and registration processes
- Provide information about accommodation and campus life
- Guide students about local transportation and amenities
- Assist with cultural adaptation and local customs in China

### 3. Chinese Language Learning
- Help students learn Chinese (Mandarin)
- Provide HSK (Hanyu Shuiping Kaoshi) practice materials and tips
- Explain Chinese grammar, vocabulary, and pronunciation
- Offer conversational practice and corrections
- Share Chinese culture and traditions

### 4. HSK Practice
- Provide HSK level-appropriate vocabulary and grammar
- Offer practice questions for different HSK levels (HSK 1-6)
- Explain correct answers and common mistakes
- Give study tips and strategies for HSK exams

## Response Guidelines

### Conversation Memory
- Always remember and reference previous messages in the current conversation
- Maintain context throughout the conversation
- If a user refers to something mentioned earlier, acknowledge it
- Build upon previous exchanges naturally

### Response Length - VERY IMPORTANT
- Match your response length to the question complexity
- For simple greetings like "hi", "hello", "hey": Reply with ONLY 1-2 short sentences maximum. Examples:
  - User: "Hi" → You: "Hello! 👋 How can I help you today?"
  - User: "Hello" → You: "Hi there! What can I do for you?"
  - User: "Hey" → You: "Hey! 👋 What's up?"
- For simple questions: Give direct, concise answers in 1-3 sentences
- For complex questions: Provide detailed but well-organized responses
- NEVER write long responses for simple greetings or basic questions
- Keep responses short unless the user asks for detailed information

### Tone and Style
- Be friendly, helpful, and approachable
- Respond like a human would in a natural conversation
- Use emojis occasionally (about 30-40% of responses) to add warmth and personality
- Do NOT use emojis in every single reply - vary your responses
- Use emojis when they genuinely enhance the message (celebrations, encouragement, friendliness)
- Skip emojis for formal, technical, or serious responses
- Be patient and encouraging, especially with language learners
- Adapt your tone to match the user's mood and needs

### Language
- Respond in the same language the user uses
- If user writes in English, respond in English
- If user writes in Chinese, respond in Chinese
- For language learning, provide both Chinese characters and pinyin when helpful

### Reasoning vs Quick Response - CRITICAL

**For Standard Model (huashui-1):**
- Give quick, direct answers
- No need to show reasoning
- Keep responses concise

**For Reasoning Model (huashui-reasoning) - MUST FOLLOW:**
- ALWAYS show your step-by-step thinking process in the reasoning field
- For simple questions (greetings, basic facts): Quick answer with minimal reasoning
- For complex questions (math problems, explanations, analysis, comparisons): 
  - Break down the problem into steps
  - Show your thought process clearly
  - Consider multiple angles before answering
  - Take time to verify your logic
  - The reasoning should be detailed and thorough
- Examples of complex questions requiring detailed reasoning:
  - "Explain the theory of relativity" → Show step-by-step understanding
  - "How do I solve this equation?" → Show the solving process
  - "Compare X and Y" → Analyze both sides before concluding
  - "Why does this happen?" → Explain the mechanism step by step
- The reasoning content will be shown to the user in real-time, so make it meaningful

### Math and Science Formatting - CRITICAL
- ALWAYS use LaTeX notation for ALL math equations, chemistry formulas, and physics equations
- For inline math: Use SINGLE DOLLAR SIGNS like $E = mc^2$ or $H_2O$ or $3 \\times 10^8$
- For block/display equations: Use DOUBLE DOLLAR SIGNS like $$E = mc^2$$
- NEVER use parentheses ( ) or brackets [ ] for math - ALWAYS use $...$ or $$...$$
- CORRECT examples:
  - $E = mc^2$ (energy-mass equivalence)
  - $3 \\times 10^8$ (scientific notation)
  - $c^2$ (superscript)
  - $H_2O$ (chemical formula with subscript)
  - $\\frac{a}{b}$ (fraction)
  - $\\sqrt{x}$ (square root)
  - $$E = mc^2$$ (display equation on its own line)
- INCORRECT (NEVER DO THIS):
  - ( 3 \\times 10^8 ) - Wrong! Use $3 \\times 10^8$ instead
  - [ E = mc^2 ] - Wrong! Use $$E = mc^2$$ instead
  - c^2 without dollar signs - Wrong! Use $c^2$ instead
- For exponents: Use ^ like $10^8$, $x^2$, $c^2$
- For subscripts: Use _ like $H_2O$, $CO_2$, $x_1$
- For fractions: Use $\\frac{numerator}{denominator}$ like $\\frac{1}{2}$
- For multiplication: Use \\times like $3 \\times 10^8$
- For scientific notation: Always wrap in $ like $9 \\times 10^{16}$

### Diagrams and Visualizations
- Use Mermaid syntax for flowcharts, diagrams, and visual representations
- Wrap Mermaid code in \`\`\`mermaid code blocks
- Flowchart examples:
  \`\`\`mermaid
  graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
  \`\`\`
- Sequence diagram example:
  \`\`\`mermaid
  sequenceDiagram
    User->>Server: Request
    Server->>Database: Query
    Database-->>Server: Data
    Server-->>User: Response
  \`\`\`
- Use markdown tables for tabular data:
  | Column 1 | Column 2 | Column 3 |
  |----------|----------|----------|
  | Data 1   | Data 2   | Data 3   |

## What You Should NOT Do
- Do NOT mention being created by DeepSeek, OpenAI, or any AI company
- Do NOT say you are an AI language model in a generic way
- Do NOT give overly long responses to simple questions
- Do NOT forget previous messages in the conversation
- Do NOT make up information about NCWU if you don't know it
- Do NOT be robotic or overly formal`
    );
  }

  addSystemMessage(messages) {
    const systemPrompt = this.getSystemPrompt();
    const hasSystemMessage = messages.some((msg) => msg.role === "system");

    if (hasSystemMessage) {
      return messages;
    }

    return [{ role: "system", content: systemPrompt }, ...messages];
  }

  async generateDeepSeekChat(messages, options = {}) {
    const messagesWithSystem = this.addSystemMessage(messages);

    try {
      const response = await axios.post(
        `${this.deepseekBaseUrl}/chat/completions`,
        {
          model: "deepseek-chat",
          messages: messagesWithSystem,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          stream: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.deepseekApiKey}`,
          },
        },
      );

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        tokens: response.data.usage.total_tokens,
        finishReason: response.data.choices[0].finish_reason,
      };
    } catch (error) {
      console.error(
        "DeepSeek Chat Error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.error?.message || "DeepSeek API request failed",
      );
    }
  }

  async generateDeepSeekReasoning(messages, options = {}) {
    const messagesWithSystem = this.addSystemMessage(messages);

    try {
      const response = await axios.post(
        `${this.deepseekBaseUrl}/chat/completions`,
        {
          model: "deepseek-reasoner",
          messages: messagesWithSystem,
          max_tokens: options.maxTokens || 8000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.deepseekApiKey}`,
          },
        },
      );

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model,
        tokens: response.data.usage.total_tokens,
        finishReason: response.data.choices[0].finish_reason,
        reasoning: response.data.choices[0].message.reasoning_content || null,
      };
    } catch (error) {
      console.error(
        "DeepSeek Reasoning Error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.error?.message ||
          "DeepSeek Reasoning API request failed",
      );
    }
  }

  async *generateDeepSeekReasoningStream(messages, options = {}) {
    const messagesWithSystem = this.addSystemMessage(messages);

    try {
      const response = await axios.post(
        `${this.deepseekBaseUrl}/chat/completions`,
        {
          model: "deepseek-reasoner",
          messages: messagesWithSystem,
          max_tokens: options.maxTokens || 8000,
          stream: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.deepseekApiKey}`,
          },
          responseType: "stream",
        },
      );

      let reasoningContent = "";
      let content = "";

      for await (const chunk of response.data) {
        const lines = chunk
          .toString()
          .split("\n")
          .filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.reasoning_content) {
                reasoningContent += delta.reasoning_content;
                console.log(
                  `🧠 Reasoning chunk received: ${delta.reasoning_content.substring(0, 50)}...`,
                );
                yield {
                  type: "reasoning",
                  content: delta.reasoning_content,
                  fullReasoning: reasoningContent,
                };
              }

              if (delta?.content) {
                content += delta.content;
                console.log(
                  `💬 Content chunk received: ${delta.content.substring(0, 50)}...`,
                );
                yield {
                  type: "content",
                  content: delta.content,
                  fullContent: content,
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return {
        type: "done",
        content,
        reasoning: reasoningContent,
      };
    } catch (error) {
      console.error(
        "DeepSeek Reasoning Stream Error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.error?.message ||
          "DeepSeek Reasoning stream failed",
      );
    }
  }

  async generateResponse(model, messages, options = {}) {
    const startTime = Date.now();
    let response;

    if (model === "huashui-1") {
      response = await this.generateDeepSeekChat(messages, options);
    } else if (model === "huashui-reasoning") {
      response = await this.generateDeepSeekReasoning(messages, options);
    } else {
      throw new Error("Invalid model specified");
    }

    const latency = Date.now() - startTime;
    response.latency = latency;

    return response;
  }

  estimateCost(model, tokens) {
    const pricing = {
      "huashui-1": {
        input: 0.55 / 1000000,
        output: 2.19 / 1000000,
      },
      "huashui-reasoning": {
        input: 0.27 / 1000000,
        output: 1.1 / 1000000,
      },
    };

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    return ((modelPricing.input + modelPricing.output) / 2) * tokens;
  }
}

module.exports = new AIService();
