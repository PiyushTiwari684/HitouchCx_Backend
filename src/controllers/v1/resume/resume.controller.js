import fs from "fs";
import mammoth from "mammoth";
import ApiError from "../../../utils/ApiError.js";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js"; // for older versions of pdfjs-dist
import { extractWithGemini } from "../../../utils/resumeExtractor.js";

export const extractResume = async(req,res) =>{
  // get the path of the uploaded file from the multer

  const filePath = req.file?.path;
  console.log("FilePath:", filePath);

  if(!filePath){
    throw new ApiError(400," Error : File path is required from controller file ");
  }

  // read the uploaded file from the disk as a buffer 
  // this allows us to process both the pdf and word file 
  let buffer = fs.readFileSync(filePath);
  console.log("Buffer length : ", buffer.length);

  //Initialize an empty string to hold the extractedt text content 
  let textContent = "";

  // check the mimetype of the uploaded file to determine how to process it (depending on the file type)

  if(req.file.mimetype === "application/pdf"){
    // if the file is pdf we use the pdfjs-dist library to extract the text content from the buffer
    try{
      // convert the buffer to a typed array(Unit8Array) for pdfjs-dist
      const data  = new Uint8Array(buffer);
      // Load the Pdf document 
      const pdf = await pdfjsLib.getDocument({data}).promise;
      let pdfText = "";

      // iterate through all the pages and extract the data 
      for(let i =1; i <=pdf.numPages; i++){
        const page = await pdf.getPage(i); // get the page
        const content = await page.getTextContent(); // get the text content of the page 

        // concotenate all the text items on the page to a single string
        const pageText = content.items.map((item)=>item.str).join(" ");
        pdfText += `\n\n Page ${i} \n\n ${pageText}`;
      }

      textContent = pdfText; // set the Extract text content 
    }catch(err){
      console.log("Pdf-Parse Error: ", err);
      throw new ApiError(500," Failed to parse the pdf file ");
    }
  }else if(
    req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    req.file.mimetype === "application/msword"){
      // if the file is a word document we use the mammoth library to extract the text content from the buffer
      try{
        const result = await mammoth.extractRawText({buffer});
        textContent = result.value;
      }catch(err){
        throw new ApiError(500," Failed to parse the word document ");
      }
  }else{
    throw new ApiError(400," Unsupported file format. Please upload a pdf or word document ");
  } 
  
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.warn("Could not delete temp file:", error.message);
  }

  // After extracting textContent, call Gemini to structure the data
  try {
    const structuredData = await extractWithGemini(textContent);
    // Respond with both the file name and the structured data
    res.json({
      file: req.file.originalname,
      structuredData,
      message: "File uploaded, parsed, and structured successfully"
    });
  } catch (err) {
    // Handle errors from Gemini API
    console.error("Gemini API Error:", err);
    throw new ApiError(500, "Failed to structure resume data with Gemini");
  }
}