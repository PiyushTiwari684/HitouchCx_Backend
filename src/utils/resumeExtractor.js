import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { InferenceClient } from "@huggingface/inference";

function extractWithRegex(text) {
  // clean up the resume text by replacing multiple whitespaces or a single new line with a sigle space
  // this ensures regex searches are consistent and not affected by formatting or line breaks.
  const cleanedText = text.replace(/\s+/g, " ").trim();

  //Extract a possible full name.
  // This regex looks for 1 to 3 consecutive capilized words(eg: "Piyush Tiwari" )
  // Each name part must start with a capital letter followed by lowercase letters.
  const nameMatch = cleanedText.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/);

  //extract the email address using a standard email regex pattern
  const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

  // extract the phone number using a regex pattern that matches various formats
  const phoneMatch = cleanedText.match(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/,
  );

  // Extract the education section by looking for keywords like "Education" section
  // It captures everything after these words until another major section keyword(experience ,work ,skills etc)
  const educationMatch = cleanedText.match(
    /(education|qualification|degree|b\.?tech|m\.?tech|bachelor|master)[^]*?(experience|work|skills|project|$)/i,
  );

  //Extract the experience section by looking for keywords like "Experience" or work

  const experienceMatch = cleanedText.match(
    /(experience|work|employment|career)[^]*?(education|skills|project|$)/i,
  );

  // Extract the skills section by looking for keywords like "Skills" or "Technical Skills"
  const skillsMatch = cleanedText.match(
    /(skills|technical skills|expertise)[^]*?(education|experience|project|$)/i,
  );

  return {
    fullName: nameMatch ? nameMatch[1] : null,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,

    education: educationMatch
      ? educationMatch[0]
          .replace(/(education|qualification|degree|b\.?tech|m\.?tech|bachelor|master)/i, "")
          .trim()
      : null,
    experience: experienceMatch
      ? experienceMatch[0].replace(/(experience|work|employment|career)/i, "").trim()
      : null,
    skills: skillsMatch
      ? skillsMatch[0].replace(/(skills|technical skills|expertise)/i, "").trim()
      : null,
  };
}

// Helper function to sleep for a specified duration
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function extractWithGemini(text, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

      console.log(`Gemini API attempt ${attempt}/${maxRetries}`);

      const prompt = `
        Extract the following fields from this resume text and return a JSON object with keys:
        firstName, lastName, email, phone, bio, experience, education, skills.
        Resume text:
        ${text}
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp", // Experimental model (original)
        contents: [{ parts: [{ text: prompt }] }],
      });

      // Correctly access the response text
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) throw new Error("No response from Gemini");

      // Remove markdown code block if present
      const cleaned = responseText.replace(/```json|```/g, "").trim();

      let structured;
      try {
        structured = JSON.parse(cleaned);
      } catch {
        // Fallback: extract JSON block from text
        const match = cleaned.match(/\{[\s\S]*\}/);
        structured = match ? JSON.parse(match[0]) : {};
      }

      console.log("Gemini API success on attempt", attempt);
      return structured;
    } catch (err) {
      lastError = err;
      console.error(`Gemini API Error (attempt ${attempt}/${maxRetries}):`, {
        message: err.message,
        status: err.status,
        statusText: err.statusText,
      });

      // Check if it's a rate limit error (429)
      if (err.status === 429 && attempt < maxRetries) {
        // Exponential backoff with longer base wait time
        // 1st retry: 5s, 2nd retry: 10s, 3rd retry: 20s
        const waitTime = Math.pow(2, attempt) * 2500;
        console.log(`Rate limit hit. Waiting ${waitTime / 1000}s before retry...`);
        await sleep(waitTime);
        continue;
      }

      // For non-429 errors or if we've exhausted retries, break
      if (attempt === maxRetries) {
        break;
      }

      // For non-retryable errors, fail immediately
      if (err.status !== 429) {
        break;
      }
    }
  }

  // If all retries failed, throw error
  console.error("All Gemini API attempts failed:", lastError);
  throw new Error(
    `Failed to structure resume data with Gemini after ${maxRetries} attempts: ${lastError.message}`,
  );
}

export async function extractWithGroq(text, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      console.log(`Groq API attempt ${attempt}/${maxRetries}`);

      const prompt = `You are a resume parser. Extract information from the resume text below and return a JSON object.

IMPORTANT: For experience, education, and skills - extract the FULL content from those sections, not just labels.

Required JSON format:
{
  "firstName": "first name only",
  "lastName": "last name only",
  "email": "email address",
  "phone": "phone number",
  "bio": "brief professional summary or objective if present",
  "experience": "ALL work experience details including company names, roles, dates, and descriptions",
  "education": "ALL education details including degrees, institutions, dates, and scores",
  "skills": "ALL skills listed, comma separated"
}

Resume text:
${text}

Return ONLY the JSON object, no markdown, no explanations:`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile", // Fast and accurate
        temperature: 0.1,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) throw new Error("No response from Groq");

      // Remove markdown code block if present
      const cleaned = responseText.replace(/```json|```/g, "").trim();

      let structured;
      try {
        structured = JSON.parse(cleaned);
      } catch {
        // Fallback: extract JSON block from text
        const match = cleaned.match(/\{[\s\S]*\}/);
        structured = match ? JSON.parse(match[0]) : {};
      }

      console.log("Groq API success on attempt", attempt);
      return structured;
    } catch (err) {
      lastError = err;
      console.error(`Groq API Error (attempt ${attempt}/${maxRetries}):`, {
        message: err.message,
        status: err.status,
      });

      // Check if it's a rate limit error (429)
      if (err.status === 429 && attempt < maxRetries) {
        // Exponential backoff
        const waitTime = Math.pow(2, attempt) * 2500;
        console.log(`Rate limit hit. Waiting ${waitTime / 1000}s before retry...`);
        await sleep(waitTime);
        continue;
      }

      // For non-429 errors or if we've exhausted retries, break
      if (attempt === maxRetries) {
        break;
      }

      // For non-retryable errors, fail immediately
      if (err.status !== 429) {
        break;
      }
    }
  }

  // If all retries failed, throw error (let cascading handle fallback)
  console.error("All Groq API attempts failed:", lastError);
  throw new Error(`Groq API failed: ${lastError?.message}`);
}

// HuggingFace extraction function using official SDK
export async function extractWithHuggingFace(text) {
  try {
    console.log("HuggingFace API attempt...");

    const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

    const prompt = `Extract the following fields from this resume text and return ONLY a valid JSON object:
{"firstName": "", "lastName": "", "email": "", "phone": "", "bio": "", "experience": "", "education": "", "skills": ""}

Resume text:
${text}

Return ONLY the JSON object, no markdown, no explanations:`;

    const chatCompletion = await client.chatCompletion({
      model: "HuggingFaceTB/SmolLM3-3B",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) throw new Error("No response from HuggingFace");

    console.log("HuggingFace raw response:", responseText.substring(0, 500));

    // Remove markdown code block if present
    const cleaned = responseText.replace(/```json|```/g, "").trim();

    let structured;
    try {
      // Try to extract JSON object from response
      const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        structured = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseErr) {
      console.warn("JSON parse failed, attempting manual extraction");
      // Manual extraction fallback
      structured = {
        firstName: cleaned.match(/"firstName"\s*:\s*"([^"]*)"/)?.[1] || "",
        lastName: cleaned.match(/"lastName"\s*:\s*"([^"]*)"/)?.[1] || "",
        email: cleaned.match(/"email"\s*:\s*"([^"]*)"/)?.[1] || "",
        phone: cleaned.match(/"phone"\s*:\s*"([^"]*)"/)?.[1] || "",
        bio: cleaned.match(/"bio"\s*:\s*"([^"]*)"/)?.[1] || "",
        experience: cleaned.match(/"experience"\s*:\s*"([^"]*)"/)?.[1] || "",
        education: cleaned.match(/"education"\s*:\s*"([^"]*)"/)?.[1] || "",
        skills: cleaned.match(/"skills"\s*:\s*"([^"]*)"/)?.[1] || "",
      };
    }

    console.log("✅ HuggingFace API success");
    return structured;
  } catch (err) {
    console.error("HuggingFace API Error:", err.message);
    throw new Error(`HuggingFace API failed: ${err.message}`);
  }
}

// Helper to format regex result to standard format
function formatRegexResult(regexResult) {
  return {
    firstName: regexResult.fullName?.split(" ")[0] || "",
    lastName: regexResult.fullName?.split(" ").slice(1).join(" ") || "",
    email: regexResult.email || "",
    phone: regexResult.phone || "",
    bio: "",
    experience: regexResult.experience || "",
    education: regexResult.education || "",
    skills: regexResult.skills || "",
  };
}

// Main cascading fallback function - tries services in order of speed
export async function extractResumeWithFallback(text) {
  const services = [
    { name: "Groq", fn: () => extractWithGroq(text, 1) }, // Fastest - 1 retry only
    { name: "HuggingFace", fn: () => extractWithHuggingFace(text) }, // 2nd fastest
    { name: "Gemini", fn: () => extractWithGemini(text, 1) }, // 3rd - 1 retry only
  ];

  for (const service of services) {
    try {
      console.log(`\n🔄 Trying ${service.name}...`);
      const result = await service.fn();
      console.log(`✅ Success with ${service.name}`);
      return { ...result, _extractedBy: service.name };
    } catch (err) {
      console.warn(`❌ ${service.name} failed: ${err.message}`);
      continue;
    }
  }

  // If all AI services fail, use regex as final fallback
  console.log("\n📝 All AI services failed. Using regex fallback...");
  const regexResult = extractWithRegex(text);
  return { ...formatRegexResult(regexResult), _extractedBy: "Regex" };
}
