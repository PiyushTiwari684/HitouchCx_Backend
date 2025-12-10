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

      const prompt = `You are a resume parser. Extract information from the resume text below and return a JSON object.

IMPORTANT: For experience, education, and skills - extract the FULL content from those sections, not just labels.

Required JSON format:
{
  "firstName": "first name only",
  "lastName": "last name only",
  "email": "email address",
  "phone": "phone number with country code if present",
  "dateOfBirth": "YYYY-MM-DD format if mentioned, otherwise null",
  "bio": "brief professional summary or objective if present",
  "fullEducation": "ALL education details including degrees, institutions, dates, and scores",
  "fullExperience": "ALL work experience details including company names, roles, dates, and descriptions",
  "fullSkills": "ALL skills listed, comma separated",
  "languages": "languages known, comma separated",
  "currentCompany": "current or most recent company name, otherwise null",
  "currentRole": "current or most recent job title/role, otherwise null",
  "yearsOfExperience": "total years of experience as a number (e.g., 3), otherwise null",
  "isCurrentlyEmployed": "true if currently working, false if not, null if unknown"
}

Resume text:
${text}

Return ONLY the JSON object, no markdown, no explanations:`;

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
  "phone": "phone number with country code if present",
  "dateOfBirth": "YYYY-MM-DD format if mentioned, otherwise null",
  "bio": "brief professional summary or objective if present",
  "fullEducation": "ALL education details including degrees, institutions, dates, and scores",
  "fullExperience": "ALL work experience details including company names, roles, dates, and descriptions",
  "fullSkills": "ALL skills listed, comma separated",
  "languages": "languages known, comma separated",
  "currentCompany": "current or most recent company name, otherwise null",
  "currentRole": "current or most recent job title/role, otherwise null",
  "yearsOfExperience": "total years of experience as a number (e.g., 3), otherwise null",
  "isCurrentlyEmployed": "true if currently working, false if not, null if unknown"
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

    const prompt = `You are a resume parser. Extract information from the resume text below and return a JSON object.

IMPORTANT: For experience, education, and skills - extract the FULL content from those sections, not just labels.

Required JSON format:
{
  "firstName": "first name only",
  "lastName": "last name only",
  "email": "email address",
  "phone": "phone number with country code if present",
  "dateOfBirth": "YYYY-MM-DD format if mentioned, otherwise null",
  "bio": "brief professional summary or objective if present",
  "fullEducation": "ALL education details including degrees, institutions, dates, and scores",
  "fullExperience": "ALL work experience details including company names, roles, dates, and descriptions",
  "fullSkills": "ALL skills listed, comma separated",
  "languages": "languages known, comma separated",
  "currentCompany": "current or most recent company name, otherwise null",
  "currentRole": "current or most recent job title/role, otherwise null",
  "yearsOfExperience": "total years of experience as a number (e.g., 3), otherwise null",
  "isCurrentlyEmployed": "true if currently working, false if not, null if unknown"
}

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
        dateOfBirth: cleaned.match(/"dateOfBirth"\s*:\s*"([^"]*)"/)?.[1] || null,
        bio: cleaned.match(/"bio"\s*:\s*"([^"]*)"/)?.[1] || "",
        fullEducation: cleaned.match(/"fullEducation"\s*:\s*"([^"]*)"/)?.[1] || "",
        fullExperience: cleaned.match(/"fullExperience"\s*:\s*"([^"]*)"/)?.[1] || "",
        fullSkills: cleaned.match(/"fullSkills"\s*:\s*"([^"]*)"/)?.[1] || "",
        languages: cleaned.match(/"languages"\s*:\s*"([^"]*)"/)?.[1] || "",
        currentCompany: cleaned.match(/"currentCompany"\s*:\s*"([^"]*)"/)?.[1] || null,
        currentRole: cleaned.match(/"currentRole"\s*:\s*"([^"]*)"/)?.[1] || null,
        yearsOfExperience: cleaned.match(/"yearsOfExperience"\s*:\s*(\d+|null)/)?.[1] || null,
        isCurrentlyEmployed: cleaned.match(/"isCurrentlyEmployed"\s*:\s*(true|false|null)/)?.[1] || null,
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

/**
 * Transform raw AI-extracted data to frontend form format
 * Maps free-text fields to strict enum values required by frontend
 * @param {Object} rawData - Raw data from AI extraction
 * @returns {Object} Formatted data matching frontend form structure
 */
export function transformToFrontendFormat(rawData) {
  // Helper: Map education text to qualification enum
  const mapQualification = (eduText) => {
    if (!eduText) return '';
    const lower = eduText.toLowerCase();
    if (lower.includes('phd') || lower.includes('ph.d') || lower.includes('doctorate')) return 'phd';
    if (lower.includes('master') || lower.includes('m.tech') || lower.includes('m.sc') || lower.includes('mba') || lower.includes('m.a')) return 'master';
    if (lower.includes('bachelor') || lower.includes('b.tech') || lower.includes('b.e') || lower.includes('b.sc') || lower.includes('bca') || lower.includes('b.a')) return 'bachelor';
    if (lower.includes('high school') || lower.includes('12th') || lower.includes('intermediate') || lower.includes('higher secondary')) return 'highschool';
    return 'bachelor'; // default
  };

  // Helper: Map years to experience range enum
  const mapExperience = (years) => {
    if (!years) return '0-1';
    const num = parseInt(years);
    if (isNaN(num) || num <= 1) return '0-1';
    if (num <= 3) return '1-3';
    if (num <= 5) return '3-5';
    return '5+';
  };

  // Helper: Map employment status
  const mapEmploymentStatus = (isEmployed, expText) => {
    if (isEmployed === true || isEmployed === 'true') return 'employed';
    if (!expText) return 'unemployed';
    const lower = expText.toLowerCase();
    if (lower.includes('student') || lower.includes('pursuing') || lower.includes('studying')) return 'student';
    return 'unemployed';
  };

  // Helper: Map industry from experience/role
  const mapIndustry = (company, role, expText) => {
    const text = `${company || ''} ${role || ''} ${expText || ''}`.toLowerCase();
    if (text.includes('software') || text.includes('tech') || text.includes('developer') || text.includes('programmer') || text.includes('it ')) return 'it';
    if (text.includes('financ') || text.includes('bank') || text.includes('account')) return 'finance';
    if (text.includes('health') || text.includes('medical') || text.includes('hospital') || text.includes('pharma')) return 'healthcare';
    if (text.includes('retail') || text.includes('sales') || text.includes('store') || text.includes('commerce')) return 'retail';
    if (text.includes('educat') || text.includes('teach') || text.includes('school') || text.includes('university')) return 'education';
    return 'it'; // default
  };

  // Helper: Map role from job title
  const mapRole = (roleText, expText) => {
    const text = `${roleText || ''} ${expText || ''}`.toLowerCase();
    if (text.includes('develop') || text.includes('engineer') || text.includes('programmer') || text.includes('software')) return 'developer';
    if (text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('graphic')) return 'designer';
    if (text.includes('manag') || text.includes('lead') || text.includes('director') || text.includes('head')) return 'manager';
    if (text.includes('analyst') || text.includes('data') || text.includes('business') || text.includes('research')) return 'analyst';
    return 'developer'; // default
  };

  // Helper: Map skills to primary category
  const mapSkills = (skillsText) => {
    if (!skillsText) return 'customer-service';
    const lower = skillsText.toLowerCase();

    // Count keyword occurrences for each category
    const scores = {
      'technical-support': 0,
      'sales': 0,
      'data-entry': 0,
      'customer-service': 0
    };

    if (lower.includes('technical') || lower.includes('support') || lower.includes('troubleshoot') || lower.includes('helpdesk')) scores['technical-support'] += 2;
    if (lower.includes('sales') || lower.includes('selling') || lower.includes('marketing') || lower.includes('business development')) scores['sales'] += 2;
    if (lower.includes('data entry') || lower.includes('typing') || lower.includes('excel') || lower.includes('documentation')) scores['data-entry'] += 2;
    if (lower.includes('customer') || lower.includes('client') || lower.includes('service') || lower.includes('communication')) scores['customer-service'] += 1;

    // Return category with highest score
    const maxCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    return maxCategory;
  };

  // Helper: Convert month name to number
  const getMonthNumber = (monthName) => {
    const months = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12'
    };
    return months[monthName.toLowerCase()] || '01';
  };

  // Helper: Extract dates from experience text
  const extractDates = (expText) => {
    if (!expText) return { startDate: '', endDate: '' };

    // Try to match date patterns
    // Pattern 1: "2020 - 2023" or "2020-2023"
    let match = expText.match(/(\d{4})\s*[-–—to]+\s*(\d{4}|present|current)/i);
    if (match) {
      const startYear = match[1];
      const endYear = match[2].toLowerCase().includes('present') || match[2].toLowerCase().includes('current') ? '' : match[2];
      return {
        startDate: `${startYear}-01-01`,
        endDate: endYear ? `${endYear}-12-31` : ''
      };
    }

    // Pattern 2: "Jan 2020 - Dec 2023"
    match = expText.match(/([A-Za-z]+)\s+(\d{4})\s*[-–—to]+\s*([A-Za-z]+)?\s*(\d{4}|present|current)/i);
    if (match) {
      const startMonth = getMonthNumber(match[1]);
      const startYear = match[2];
      const endMonth = match[3] ? getMonthNumber(match[3]) : '12';
      const endYear = match[4].toLowerCase().includes('present') || match[4].toLowerCase().includes('current') ? '' : match[4];

      return {
        startDate: `${startYear}-${startMonth}-01`,
        endDate: endYear ? `${endYear}-${endMonth}-01` : ''
      };
    }

    return { startDate: '', endDate: '' };
  };

  // Perform transformation
  const dates = extractDates(rawData.fullExperience || '');

  return {
    firstName: rawData.firstName || '',
    lastName: rawData.lastName || '',
    email: rawData.email || '',
    phone: rawData.phone || '',
    dateOfBirth: rawData.dateOfBirth || '', // Leave empty if not found
    qualification: mapQualification(rawData.fullEducation),
    experience: mapExperience(rawData.yearsOfExperience),
    employmentStatus: mapEmploymentStatus(rawData.isCurrentlyEmployed, rawData.fullExperience),
    companyName: rawData.currentCompany || '',
    industry: mapIndustry(rawData.currentCompany, rawData.currentRole, rawData.fullExperience),
    role: mapRole(rawData.currentRole, rawData.fullExperience),
    startDate: dates.startDate,
    endDate: dates.endDate,
    skills: mapSkills(rawData.fullSkills),
    timeSlot: '', // Cannot be extracted from resume
    workingHours: '', // Cannot be extracted from resume
    languages: rawData.languages || ''
  };
}
