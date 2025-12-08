import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Generate AI response for custom questions
export async function generateAIResponse(question, conversationHistory = []) {
  try {
    // Build messages array
    const messages = [
      {
        role: "system",
        content: `You are a helpful support assistant. Answer questions clearly and concisely. 
        If you don't know the answer, admit it and suggest contacting human support.
        Keep responses under 200 words.`,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add the current question
    messages.push({
      role: "user",
      content: question,
    });

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extract the response
    const answer = completion.choices[0].message.content;

    return answer;
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error(`AI service error: ${error.message}`);
  }
}

// Check if a question is similar to existing ones (for frequency tracking)
export async function checkQuestionSimilarity(newQuestion, existingQuestions) {
  try {
    if (existingQuestions.length === 0) {
      return null;
    }

    // Simple similarity check using Groq
    const prompt = `Compare this question: "${newQuestion}"
    
    With these existing questions:
    ${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}
    
    If the new question is similar (same intent/topic) to any existing question, 
    respond with ONLY the number (1, 2, 3, etc.) of the most similar question.
    If no similar question exists, respond with ONLY the word "NONE".`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            'You are a question similarity analyzer. Respond only with a number or "NONE".',
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 10,
    });

    const result = completion.choices[0].message.content.trim();

    if (result === "NONE") {
      return null;
    }

    const index = parseInt(result) - 1;
    if (index >= 0 && index < existingQuestions.length) {
      return existingQuestions[index];
    }

    return null;
  } catch (error) {
    console.error("Similarity check error:", error);
    return null; // On error, assume not similar
  }
}

export default groq;
