import { GoogleGenAI } from "@google/genai";

function extractWithRegex(text){
   // clean up the resume text by replacing multiple whitespaces or a single new line with a sigle space
   // this ensures regex searches are consistent and not affected by formatting or line breaks.
   const cleanedText = text.replace(/\s+/g, " ").trim();

   //Extract a possible full name.
   // This regex looks for 1 to 3 consecutive capilized words(eg: "Piyush Tiwari" )
   // Each name part must start with a capital letter followed by lowercase letters.
   const nameMatch = cleanedText.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/);

   //extract the email address using a standard email regex pattern
   const emailMatch =  cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

   // extract the phone number using a regex pattern that matches various formats
   const phoneMatch = cleanedText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/);

   // Extract the education section by looking for keywords like "Education" section
   // It captures everything after these words until another major section keyword(experience ,work ,skills etc)
   const educationMatch = cleanedText.match( /(education|qualification|degree|b\.?tech|m\.?tech|bachelor|master)[^]*?(experience|work|skills|project|$)/i)
   
   //Extract the experience section by looking for keywords like "Experience" or work

   const experienceMatch = cleanedText.match(/(experience|work|employment|career)[^]*?(education|skills|project|$)/i);

   // Extract the skills section by looking for keywords like "Skills" or "Technical Skills"
   const skillsMatch = cleanedText.match(/(skills|technical skills|expertise)[^]*?(education|experience|project|$)/i);

   return {
    fullName :nameMatch ? nameMatch[1] : null,
    email :emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,

    education : educationMatch  ?  educationMatch[0].replace(/(education|qualification|degree|b\.?tech|m\.?tech|bachelor|master)/i,"").trim() : null,
    experience : experienceMatch ? experienceMatch[0].replace(/(experience|work|employment|career)/i,"").trim() : null,
    skills : skillsMatch ? skillsMatch[0].replace(/(skills|technical skills|expertise)/i,"").trim() : null,
   };
}

export async function extractWithGemini(text) {
  try {
    const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

    console.log("Extracted Text :: ",text);

    const prompt = `
      Extract the following fields from this resume text and return a JSON object with keys: 
      firstName, lastName, email, phone, bio, experience, education, skills.
      Resume text:
      ${text}
    `;

    // const result = await ai.models.generateContent({
    //   model: "models/gemini-2.5-flash",
    //   contents: [{ parts: [{ text: prompt }] }]
    // });
    
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);

    // Log the full response for debugging
    console.log("Gemini raw result:", JSON.stringify(result, null, 2));

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

    return structured;
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw new Error("Failed to structure resume data with Gemini");
  }
 
}