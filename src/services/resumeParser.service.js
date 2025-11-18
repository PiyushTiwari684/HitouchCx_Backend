import fs from "fs";
import path from "path";
import axios from "axios";
import mammoth from "mammoth";
import { v2 as cloudinary } from "cloudinary";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const WordExtractor = require("word-extractor");

const downloadFile = async (url, outputPath) => {
  const res = await axios({
    url,
    method: "GET",
    responseType: "arraybuffer",
  });
  fs.writeFileSync(outputPath, res.data);
  return outputPath;
};

export const parseResume = async (filePath) => {
  console.log("Original Cloudinary URL:", filePath);

  const [uploadPart] = filePath.split("/upload/");

  console.log("Upload part:",uploadPart);

  if (!uploadPart) {
    throw new Error("Unexpected Cloudinary file path format");
  }

  const sanitizedPath = uploadPart.split("?")[0];
  const extension = sanitizedPath.split(".").pop()?.toLowerCase();

  if (!extension) {
    throw new Error("Unable to determine file extension for resume");
  }

  const publicId = sanitizedPath
    .replace(/\.[^/.]+$/, "")
    .replace(/^v\d+\//, "");

  console.log("Derived public_id:", publicId);

  const signedUrl = cloudinary.url(publicId, {
    resource_type: "raw",
    type: "upload",
    format: extension,
    secure: true,
    sign_url: true,
  });

  const localPath = path.join(
    process.cwd(),
    `temp_resume_${Date.now()}.${extension}`
  );
  await downloadFile(signedUrl, localPath);

  let text = "";
  if (extension === "pdf") {
    const dataBuffer = fs.readFileSync(localPath);
    const pdfData = await pdfParse(dataBuffer);
    text = pdfData.text;
  } else if (extension === "docx") {
    const result = await mammoth.extractRawText({ path: localPath });
    text = result.value;
  } else if (extension === "doc") {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(localPath);
    text = doc.getBody();
  } else {
    throw new Error("Unsupported file type. Please upload PDF, DOC, or DOCX.");
  }

  try {
    fs.unlinkSync(localPath);
  } catch (err) {
    console.warn("Could not delete temp file:", err.message);
  }
  return text.trim();
};
