
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Pedagogical AI Rule: "Buffer, don't Tutor."
 * 1. Extract Intent
 * 2. Reflective Mirroring
 * 3. Single-step scaffold
 */

export async function generateWelcomeSafetyMessage(userName: string, matkul: string): Promise<string> {
  const systemInstruction = `
    You are a supportive AI learning companion in a TAI (Team-Assisted Individualization) environment.
    Your role is to reduce Math Anxiety using Epistemic Framing.
    Avoid standard motivation. Instead, normalize the difficulty of ${matkul}.
    Message must be: "Confused is a sign of thinking", "Mistakes are just raw data", "This space is private and safe".
    Language: Indonesian. Max 20 words.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User: ${userName}. Context: Safe learning start.`,
      config: { systemInstruction }
    });
    return response.text || "Halo! Di sini, kebingungan adalah tanda kamu sedang berpikir keras. Mari bereksplorasi.";
  } catch {
    return "Selamat datang! Ruang ini aman untuk mencoba tanpa takut dinilai.";
  }
}

export async function generateScaffoldingPrompt(
  problem: string,
  fieldName: string,
  userAnswer: string
): Promise<string> {
  const systemInstruction = `
    PEDAGOGICAL RULES:
    1. Identify the student's intent, even if the math is wrong.
    2. Respond with "Silent Validation": Rephrase their idea neutrally (e.g., "Kamu sedang mencoba menghubungkan X dengan Y...").
    3. Ask ONE question to advance their thinking by ONE step.
    4. CRITICAL: Never use evaluative words like "Correct", "Wrong", "Good", "Error".
    5. CRITICAL: Do not give the answer.
    Language: Indonesian. Max 3 sentences.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context Problem: ${problem}. Area: ${fieldName}. Student reasoning: "${userAnswer}"`,
      config: { systemInstruction }
    });
    return response.text || "Pendekatanmu menarik. Apa yang menurutmu akan terjadi jika nilai tersebut berubah?";
  } catch {
    return "Kamu sedang mengeksplorasi hubungan antar variabel. Bagaimana caramu memastikan langkah berikutnya?";
  }
}

export async function generatePostTestReflectionPrompt(score: number): Promise<string> {
  const prompt = `
    A student just finished a Fact Test. Score is irrelevant (${score}/100).
    Your goal is "Process-First Feedback".
    Ask a question about their uncertainty or a specific strategy they felt good about.
    Normalize failure if score is low, or curiosity if score is high.
    Example: "Bagian mana yang tadi membuatmu merasa paling ragu?"
    Language: Indonesian. Max 15 words.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Bagian mana dari pengerjaan tadi yang membuatmu merasa paling tertantang?";
  } catch {
    return "Bagaimana perasaanmu setelah melewati tantangan soal-soal tadi?";
  }
}
