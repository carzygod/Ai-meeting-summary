import { GoogleGenAI, Type, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to check API Key
export const hasApiKey = () => !!apiKey;

/**
 * Summarize meeting notes or transcript
 */
export const summarizeMeeting = async (transcript: string): Promise<{ summary: string; tags: string[]; keyPoints: string[] }> => {
  if (!apiKey) throw new Error("API Key missing");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following meeting transcript. Provide a summary, extract 3-5 tags, and list key bullet points. 
      
      Transcript:
      ${transcript}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Summarization failed", error);
    return { summary: "Error generating summary.", tags: [], keyPoints: [] };
  }
};

/**
 * Analyze customer data to generate insights
 */
export const analyzeCustomerData = async (conversationHistory: string, customerName: string) => {
  if (!apiKey) throw new Error("API Key missing");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for deeper reasoning
      contents: `Analyze the following interaction history with customer ${customerName}. 
      Generate a customer persona, identify their primary business pain points, and suggest a marketing angle.
      
      History:
      ${conversationHistory}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personaAnalysis: { type: Type.STRING, description: "Psychological and behavioral profile" },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedMarketingCopy: { type: Type.STRING, description: "A short email draft or pitch" },
            relationshipScore: { type: Type.INTEGER, description: "1-100 score of relationship strength" },
          },
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("CRM Analysis failed", error);
    throw error;
  }
};

/**
 * Training Simulator: Generate Customer Response
 */
export const generateSimulationResponse = async (
  history: { role: string; text: string }[],
  config: { scenario: string; customerPersona: string; difficulty: string }
) => {
  if (!apiKey) throw new Error("API Key missing");

  // Construct the prompt with history
  const systemInstruction = `You are a roleplay actor for corporate training. 
  Scenario: ${config.scenario}.
  Your Role: A customer named ${config.customerPersona}.
  Difficulty: ${config.difficulty}.
  
  Instructions:
  1. Stay in character completely. Do not break the fourth wall.
  2. If difficulty is Hard, be skeptical, interrupt, or be vague.
  3. If difficulty is Easy, be cooperative.
  4. Keep responses concise (under 50 words) like a real spoken conversation.
  `;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
    }
  });

  // Replay history to state (simplified for this demo, usually handled by chat object state)
  // We will just send the last message as the prompt for simplicity in this stateless wrapper,
  // or use the history if we maintained the chat object instance.
  // For this stateless service pattern:
  
  const lastUserMessage = history[history.length - 1];
  
  // Note: For a robust app, we'd persist the 'chat' object. 
  // Here we re-instantiate with history context if needed, but for simplicity, 
  // we'll treat it as a single turn generation with history context in prompt if we aren't using chat.sendMessage history.
  // Let's use generateContent for stateless simplicity passing history as text context if needed, 
  // BUT the chat API is better.
  
  // Correct approach for Chat in this architecture:
  // The UI should maintain the chat history text. We will send the history formatted.
  const contents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
  }));

  // Create a fresh chat with history
  const session = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: contents.slice(0, -1), // All except last
      config: { systemInstruction }
  });

  const response = await session.sendMessage({ message: lastUserMessage.text });
  return response.text;
};

/**
 * Training Simulator: Real-time Assistant/Coach
 */
export const getCoachingTip = async (lastUserText: string, lastCustomerText: string) => {
    if (!apiKey) return "API Key missing";

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I am a sales trainee. 
        Customer just said: "${lastCustomerText}"
        I replied: "${lastUserText}"
        
        Give me one short, specific piece of advice (max 1 sentence) on how to improve my reply or what to watch out for.`,
    });
    return response.text;
};

/**
 * Text to Speech for Voice Mode
 */
export const generateSpeech = async (text: string): Promise<string | null> => {
    if (!apiKey) return null;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if(base64Audio) {
            return `data:audio/mp3;base64,${base64Audio}`;
        }
        return null;
    } catch (e) {
        console.error("TTS Failed", e);
        return null;
    }
}
