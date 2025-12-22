import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import ApiError from "../../../utils/ApiError.js";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { extractResumeWithFallback, transformToFrontendFormat } from "../../../utils/resumeExtractor.js";
import axios from "axios";

/**
 * Download file from Cloudinary URL to temporary location
 * @param {string} cloudinaryUrl - URL of the file on Cloudinary
 * @returns {Promise<{path: string, buffer: Buffer}>} - Temp file path and buffer
 */
async function downloadFromCloudinary(cloudinaryUrl) {
  try {
    console.log('📥 Downloading file from Cloudinary:', cloudinaryUrl);

    const response = await axios.get(cloudinaryUrl, {
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data);

    // Create temp file in /tmp (works on Render)
    const tempFileName = `resume-${Date.now()}-${Math.random().toString(36).substring(7)}.tmp`;
    const tempPath = path.join('/tmp', tempFileName);

    fs.writeFileSync(tempPath, buffer);

    console.log('✅ File downloaded to temp:', tempPath);

    return { path: tempPath, buffer };
  } catch (error) {
    console.error('❌ Error downloading from Cloudinary:', error.message);
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

/**
 * Extract resume data from uploaded file
 */
export const extractResume = async (req, res) => {
  let tempFilePath = null;

  try {
    // When using CloudinaryStorage, req.file.path is Cloudinary URL
    const cloudinaryUrl = req.file?.path;

    if (!cloudinaryUrl) {
      throw new ApiError(400, "Error: File upload failed");
    }

    console.log('📄 Processing resume from Cloudinary URL:', cloudinaryUrl);

    // Download file from Cloudinary to temp location
    const { path: filePath, buffer } = await downloadFromCloudinary(cloudinaryUrl);
    tempFilePath = filePath;

    console.log("Buffer length:", buffer.length);

    // Initialize an empty string to hold the extracted text content
    let textContent = "";

    // Check the mimetype of the uploaded file to determine how to process it
    if (req.file.mimetype === "application/pdf") {
      // Process PDF
      try {
        const data = new Uint8Array(buffer);
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        let pdfText = "";

        // Iterate through all pages and extract text
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => item.str).join(" ");
          pdfText += `\n\n Page ${i} \n\n ${pageText}`;
        }

        textContent = pdfText;
      } catch (err) {
        console.log("PDF-Parse Error:", err);
        throw new ApiError(500, "Failed to parse the PDF file");
      }
    } else if (
      req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      req.file.mimetype === "application/msword"
    ) {
      // Process Word document
      try {
        const result = await mammoth.extractRawText({ buffer });
        textContent = result.value;
      } catch (err) {
        throw new ApiError(500, "Failed to parse the Word document");
      }
    } else {
      throw new ApiError(400, "Unsupported file format. Please upload a PDF or Word document");
    }

    // Delete temp file
    try {
      fs.unlinkSync(tempFilePath);
      console.log('🗑️ Temp file deleted');
    } catch (error) {
      console.warn("⚠️ Could not delete temp file:", error.message);
    }

    // Extract and structure data using AI
    try {
      // Step 1: Extract raw data using AI (Groq/HuggingFace/Gemini with fallback)
      const rawData = await extractResumeWithFallback(textContent);
      console.log("✅ Raw AI extraction successful:", rawData._extractedBy);

      // Step 2: Transform raw data to frontend form format
      const structuredData = transformToFrontendFormat(rawData);
      console.log("✅ Data transformation complete");

      // Respond with structured data and Cloudinary URL
      res.json({
        file: req.file.originalname,
        cloudinaryUrl: cloudinaryUrl,
        structuredData,
        message: "Resume uploaded, parsed, and structured successfully"
      });
    } catch (err) {
      console.error("❌ Resume extraction error:", err);
      throw new ApiError(500, "Failed to structure resume data with AI");
    }
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (unlinkError) {
        console.warn("⚠️ Could not delete temp file:", unlinkError.message);
      }
    }

    // Return error response
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to process resume";

    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
};
