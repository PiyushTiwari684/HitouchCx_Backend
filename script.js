// function extractWithRegex(text){
//    // clean up the resume text by replacing multiple whitespaces or a single new line with a sigle space
//    // this ensures regex searches are consistent and not affected by formatting or line breaks.
//    const cleanedText = text.replace(/\s+/g, " ").trim();

//    //Extract a possible full name.
//    // This regex looks for 1 to 3 consecutive capilized words(eg: "Piyush Tiwari" )
//    // Each name part must start with a capital letter followed by lowercase letters.
//    const nameMatch = cleanedText.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/);

//    //extract the email address using a standard email regex pattern
//    const emailMatch =  cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

//    // extract the phone number using a regex pattern that matches various formats
//    const phoneMatch = cleanedText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/);

//    // Extract the education section by looking for keywords like "Education" section
//    // It captures everything after these words until another major section keyword(experience ,work ,skills etc)
//    const educationMatch = cleanedText.match( /(education|qualification|degree|b\.?tech|m\.?tech|bachelor|master)[^]*?(experience|work|skills|project|$)/i)
   
//    //Extract the experience section by looking for keywords like "Experience" or work

//    const experienceMatch = cleanedText.match(/(experience|work|employment|career)[^]*?(education|skills|project|$)/i);

//    // Extract the skills section by looking for keywords like "Skills" or "Technical Skills"
//    const skillsMatch = cleanedText.match(/(skills|technical skills|expertise)[^]*?(education|experience|project|$)/i);

//    return {
//     fullName :nameMatch ? nameMatch[1] : null,
//     email :emailMatch ? emailMatch[0] : null,
//     phone: phoneMatch ? phoneMatch[0] : null,

//     education : educationMatch  ?  educationMatch[0].replace(/(education|qualification|degree|b\.?tech|m\.?tech|bachelor|master)/i,"").trim() : null,
//     experience : experienceMatch ? experienceMatch[0].replace(/(experience|work|employment|career)/i,"").trim() : null,
//     skills : skillsMatch ? skillsMatch[0].replace(/(skills|technical skills|expertise)/i,"").trim() : null,
//    };
// }

// const text = {
//     "file":"1760504119240-Shamayil_Ahmad_Resume.pdf","extractedText":"\n\n Page 1 \n\n Shamayil Ahmad +91 7017235994 | shamayil.amd@gmail.com | www.github.com/shamayil2 Profile Full Stack Web Developer skilled in Javascript,React.js,Express.js,MongoDB and other web technologies having expertise in developing and designing Web Applications from scratch.Love solving complex and challenging problems. Skills & Abilities · Javascript · React.js · MongoDB · Express.js · Web Layout Designing · HTML · CSS · GitHub · Bootstrap · Node.js Work Experience The Web Plant Junior Web Developer Intern | February 2025 - June 2025 · Created Templates and Migrated Websites on Hubspot Content Hub. · Used HTML,CSS,Javascript on Hubspot Design Manager to make templates. · Utilized and created different modules in Hubspot Design Manager to make templates. Projects Teal Electronics | E-Commerce | ReactJS,ExpressJS,MongoDB| April 2025 | View Project · Developed an E-Commerce Web Application with features like Search,Filtering,Cart Handling etc. · Created different pages including Products Page,Wishlist,Cart,User Profile using React Router. · Can Add Products to Cart,Wishlist and can place orders directly.Orders are saved to Database. · Can filter and sort products based on price,ratings,categories etc using hooks like useState and useRef. · Created Alerts and Loading Messages using React Hooks like useEffect. · User Profile Page to view and edit Addresses, Order History. · Made APIs and Routes using ExpressJS to fetch products and other data from database.. · Designed different schemas like Products,Orders etc using Referencing. Meetup App | ReactJS,ExpressJS,MongoDb,Bootstrap | January 202 5 | View Project · An App where different types of events are listed. Used Bootstrap and CSS for designing. · Feature to search and filter events based on type,title,tags. Used React Hooks and React Router to navigate. · Created APIs using Express to retrieve data from MongoDB Players Management App | ReactJS | December 202 4 | View Project · Used React Router to navigate through different routes within the app. · Can filter players through their teams. Used React Hooks for this feature. EDUCATION B. Tech in C omputer Science & Engineering | 2020-2024 | JAMIA HAMDARD New Delhi C LASS XII | 2018-2019| SHARDEIN SCHOOL, MUZAFFARNAGAR | SCORE: 89% CLASS X | 2016-2017| SHARDEIN SCHOOL, MUZAFFARNAGAR | SCORE: CGPA 10","message":" File uploaded and parsed successfully "
// }


// const regexResult = extractWithRegex(text.extractedText);
// console.log("Regex extraction result",regexResult);


// 2nd attempt code


// function extractWithRegex(text) {
//   // Clean up the resume text
//   const cleanedText = text.replace(/\s+/g, " ").trim();

//   // Name extraction (first and last)
//   const nameMatch = cleanedText.match(/([A-Z][a-z]+)\s([A-Z][a-z]+)/);
//   const firstName = nameMatch ? nameMatch[1] : null;
//   const lastName = nameMatch ? nameMatch[2] : null;

//   // Email
//   const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//   const email = emailMatch ? emailMatch[0] : null;

//   // Phone (normalize to digits, keep + if present)
//   const phoneMatch = cleanedText.match(/(\+?\d{1,3}[-.\s]?)?\d{10}/);
//   const phone = phoneMatch ? phoneMatch[0].replace(/[-.\s]/g, "") : null;

//   // GitHub
//   const githubMatch = cleanedText.match(/(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+/);
//   const github = githubMatch ? githubMatch[0] : null;

//   // Bio: take the first sentence after "Profile" or the first 300 chars
//   let bio = null;
//   const profileMatch = cleanedText.match(/Profile\s*([^.]+(\.[^.]+)?)/i);
//   if (profileMatch) {
//     bio = profileMatch[1].trim();
//   } else {
//     bio = cleanedText.slice(0, 300);
//   }

//   // Skills: find section, split by bullets, commas, or dots
//   let skills = [];
//   const skillsSection = cleanedText.match(/Skills? & Abilities?[\s·:]*([^.]+(\.[^.]+)?)/i);
//   if (skillsSection) {
//     skills = skillsSection[1]
//       .split(/[·•,|]/)
//       .map(s => s.trim())
//       .filter(Boolean);
//   } else {
//     // fallback: look for a comma-separated list after "Skills"
//     const skillsFallback = cleanedText.match(/Skills?[\s·:]*([A-Za-z0-9.,\s]+)/i);
//     if (skillsFallback) {
//       skills = skillsFallback[1]
//         .split(/[·•,|]/)
//         .map(s => s.trim())
//         .filter(Boolean);
//     }
//   }

//   // Experience: extract company, position, dates, and description
//   let experience = [];
//   const expSection = cleanedText.match(/Work Experience(.*?)(Projects|EDUCATION|Education|$)/i);
//   if (expSection) {
//     // Split by job/internship lines (very basic, can be improved)
//     const jobs = expSection[1].split(/(?=[A-Z][a-z]+ [A-Z][a-z]+ (Intern|at|,))/g);
//     for (const job of jobs) {
//       const companyMatch = job.match(/at ([A-Za-z &]+)/);
//       const positionMatch = job.match(/([A-Za-z ]+)(?= at )/);
//       const dateMatch = job.match(/(\w+ \d{4})\s*-\s*(\w+ \d{4})/);
//       const description = job.split("·").map(s => s.trim()).filter(Boolean);
//       if (companyMatch || positionMatch) {
//         experience.push({
//           company: companyMatch ? companyMatch[1].trim() : null,
//           position: positionMatch ? positionMatch[1].trim() : null,
//           startDate: dateMatch ? dateMatch[1] : null,
//           endDate: dateMatch ? dateMatch[2] : null,
//           description
//         });
//       }
//     }
//   }

//   // Education: extract as array of objects
//   let education = [];
//   const eduSection = cleanedText.match(/EDUCATION(.*?)(CLASS|$)/i);
//   if (eduSection) {
//     // Split by lines with | or commas
//     const eduLines = eduSection[1].split(/(?=\|)/g);
//     for (const line of eduLines) {
//       const degreeMatch = line.match(/B\.? ?Tech|Bachelor|Master|XII|X/i);
//       const institutionMatch = line.match(/([A-Za-z &]+)\s*\|/);
//       const dateMatch = line.match(/(\d{4})/g);
//       if (degreeMatch || institutionMatch) {
//         education.push({
//           institution: institutionMatch ? institutionMatch[1].trim() : null,
//           degree: degreeMatch ? degreeMatch[0] : null,
//           dates: dateMatch ? dateMatch.join("-") : null,
//           details: [line.replace(/\|/g, "").trim()]
//         });
//       }
//     }
//   }

//   return {
//     firstName,
//     lastName,
//     email,
//     phone,
//     github,
//     bio,
//     skills,
//     experience,
//     education
//   };
// }

// // Example usage:
// const text = {
//   "file": "1760504119240-Shamayil_Ahmad_Resume.pdf",
//   "extractedText": "\n\n Page 1 \n\n Shamayil Ahmad +91 7017235994 | shamayil.amd@gmail.com | www.github.com/shamayil2 Profile Full Stack Web Developer skilled in Javascript,React.js,Express.js,MongoDB and other web technologies having expertise in developing and designing Web Applications from scratch.Love solving complex and challenging problems. Skills & Abilities · Javascript · React.js · MongoDB · Express.js · Web Layout Designing · HTML · CSS · GitHub · Bootstrap · Node.js Work Experience The Web Plant Junior Web Developer Intern | February 2025 - June 2025 · Created Templates and Migrated Websites on Hubspot Content Hub. · Used HTML,CSS,Javascript on Hubspot Design Manager to make templates. · Utilized and created different modules in Hubspot Design Manager to make templates. Projects Teal Electronics | E-Commerce | ReactJS,ExpressJS,MongoDB| April 2025 | View Project · Developed an E-Commerce Web Application with features like Search,Filtering,Cart Handling etc. · Created different pages including Products Page,Wishlist,Cart,User Profile using React Router. · Can Add Products to Cart,Wishlist and can place orders directly.Orders are saved to Database. · Can filter and sort products based on price,ratings,categories etc using hooks like useState and useRef. · Created Alerts and Loading Messages using React Hooks like useEffect. · User Profile Page to view and edit Addresses, Order History. · Made APIs and Routes using ExpressJS to fetch products and other data from database.. · Designed different schemas like Products,Orders etc using Referencing. Meetup App | ReactJS,ExpressJS,MongoDb,Bootstrap | January 202 5 | View Project · An App where different types of events are listed. Used Bootstrap and CSS for designing. · Feature to search and filter events based on type,title,tags. Used React Hooks and React Router to navigate. · Created APIs using Express to retrieve data from MongoDB Players Management App | ReactJS | December 202 4 | View Project · Used React Router to navigate through different routes within the app. · Can filter players through their teams. Used React Hooks for this feature. EDUCATION B. Tech in C omputer Science & Engineering | 2020-2024 | JAMIA HAMDARD New Delhi C LASS XII | 2018-2019| SHARDEIN SCHOOL, MUZAFFARNAGAR | SCORE: 89% CLASS X | 2016-2017| SHARDEIN SCHOOL, MUZAFFARNAGAR | SCORE: CGPA 10",
//   "message": " File uploaded and parsed successfully "
// };

// const regexResult = extractWithRegex(text.extractedText);
// console.log("Regex extraction result", regexResult);


// 3rd attept code


function extractWithRegex(text) {
  // Normalize whitespace and line breaks
  const cleanedText = text.replace(/\s+/g, " ").trim();

  // -------------------- 1️⃣ Name Extraction --------------------
  // Pattern: Two capitalized words near the top (before phone/email)
  // const nameMatch = cleanedText.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)/);
  // const firstName = nameMatch ? nameMatch[1] : null;
  // const lastName = nameMatch ? nameMatch[2] : null;

    // Name extraction (first and last)
  const nameMatch = cleanedText.match(/([A-Z][a-z]+)\s([A-Z][a-z]+)/);
  const firstName = nameMatch ? nameMatch[1] : null;
  const lastName = nameMatch ? nameMatch[2] : null;
  // -------------------- 2️⃣ Email --------------------
  const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;

  // -------------------- 3️⃣ Phone --------------------
  const phoneMatch = cleanedText.match(/(\+?\d{1,3}[-.\s]?)?\d{10}/);
  const phone = phoneMatch ? phoneMatch[0].replace(/[-.\s]/g, "") : null;

  // -------------------- 4️⃣ GitHub / LinkedIn --------------------
  const githubMatch = cleanedText.match(/(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9._-]+/i);
  const github = githubMatch ? githubMatch[0].replace(/^https?:\/\//, "") : null;

  const linkedInMatch = cleanedText.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9._-]+/i);
  const linkedIn = linkedInMatch ? linkedInMatch[0].replace(/^https?:\/\//, "") : null;

  // -------------------- 5️⃣ Bio / Profile --------------------
  const profileMatch = cleanedText.match(/Profile\s+(.*?)(?=\s+Skills|Work|Projects|Education|EDUCATION)/i);
  const bio = profileMatch
    ? profileMatch[1].replace(/\s+/g, " ").trim()
    : cleanedText.slice(0, 200);

  // -------------------- 6️⃣ Skills --------------------
  // Capture text between "Skills" and "Work Experience"
  const skillsSection = cleanedText.match(/Skills\s*&?\s*Abilities?\s*(.*?)(?=\s+(Work|Projects|Education|EDUCATION))/i);
  let skills = [];

  if (skillsSection) {
    skills = skillsSection[1]
      .split(/[·•,|]/)
      .map((s) => s.trim())
      .filter((s) => s && !/Skills|Abilities/i.test(s));
  }

  // Ensure uniqueness and case consistency
  skills = [...new Set(skills.map((s) => s.replace(/\s+/g, " ")))];

  // -------------------- 7️⃣ Work Experience --------------------
  const expSection = cleanedText.match(/Work\s*Experience(.*?)(?=\s+(Projects|EDUCATION|Education|$))/i);
  const experience = [];

  if (expSection) {
    // Extract company, position, and dates
    const jobMatches = expSection[1].match(/([A-Z][A-Za-z &]+)\s+(Intern|Developer|Engineer|Manager|Designer|Analyst|Consultant)[^|]*\|\s*([A-Za-z]+\s*\d{4})\s*-\s*([A-Za-z]+\s*\d{4})([^$]*)/g);

    if (jobMatches) {
      for (const job of jobMatches) {
        const companyMatch = job.match(/^([A-Z][A-Za-z &]+)/);
        const positionMatch = job.match(/([A-Za-z ]+(Intern|Developer|Engineer|Manager|Designer|Analyst|Consultant))/);
        const dateMatch = job.match(/([A-Za-z]+\s*\d{4})\s*-\s*([A-Za-z]+\s*\d{4})/);
        const descriptionMatches = job.split(/·/).map((x) => x.trim()).filter((x) => x && !x.includes("|"));

        experience.push({
          company: companyMatch ? companyMatch[1].trim() : null,
          position: positionMatch ? positionMatch[1].trim() : null,
          startDate: dateMatch ? dateMatch[1] : null,
          endDate: dateMatch ? dateMatch[2] : null,
          description: descriptionMatches.slice(1),
        });
      }
    }
  }

  // -------------------- 8️⃣ Projects --------------------
  const projects = [];
  const projectsSection = cleanedText.match(/Projects(.*?)(?=\s+EDUCATION|Education|$)/i);
  if (projectsSection) {
    const projectMatches = projectsSection[1].match(/([A-Z][A-Za-z &]+)\s*\|\s*([A-Za-z,]+)\s*\|\s*([A-Za-z,]+)\s*\|\s*([A-Za-z]+\s*\d{4})/g);
    if (projectMatches) {
      for (const proj of projectMatches) {
        const parts = proj.split("|").map((x) => x.trim());
        projects.push({
          title: parts[0] || null,
          techStack: parts[2] ? parts[2].split(",").map((t) => t.trim()) : [],
          date: parts[3] || null,
        });
      }
    }
  }

  // -------------------- 9️⃣ Education --------------------
  const education = [];
  const eduSection = cleanedText.match(/EDUCATION(.*)/i);
  if (eduSection) {
    const eduLines = eduSection[1].split(/CLASS|C LASS/).filter(Boolean);
    for (const line of eduLines) {
      const degreeMatch = line.match(/B\.?\s?Tech|Bachelor|Master|XII|X/i);
      const institutionMatch = line.match(/\|\s*([A-Za-z ]+)\s*\|/);
      const dateMatch = line.match(/(\d{4})/g);
      const scoreMatch = line.match(/SCORE[:\s]*([0-9.%A-Za-z]+)/i);

      if (degreeMatch) {
        education.push({
          degree: degreeMatch[0],
          institution: institutionMatch ? institutionMatch[1].trim() : null,
          dates: dateMatch ? dateMatch.join(" - ") : null,
          score: scoreMatch ? scoreMatch[1] : null,
        });
      }
    }
  }

  // -------------------- 🔟 Final structured response --------------------
  return {
    firstName,
    lastName,
    email,
    phone,
    github,
    linkedIn,
    bio,
    skills,
    experience,
    projects,
    education,
  };
}

// const text = {
//   "file": "1760504119240-Shamayil_Ahmad_Resume.pdf",
//   "extractedText": "\n\n Page 1 \n\n Shamayil Ahmad +91 7017235994 | shamayil.amd@gmail.com | www.github.com/shamayil2 Profile Full Stack Web Developer skilled in Javascript,React.js,Express.js,MongoDB and other web technologies having expertise in developing and designing Web Applications from scratch.Love solving complex and challenging problems. Skills & Abilities · Javascript · React.js · MongoDB · Express.js · Web Layout Designing · HTML · CSS · GitHub · Bootstrap · Node.js Work Experience The Web Plant Junior Web Developer Intern | February 2025 - June 2025 · Created Templates and Migrated Websites on Hubspot Content Hub. · Used HTML,CSS,Javascript on Hubspot Design Manager to make templates. · Utilized and created different modules in Hubspot Design Manager to make templates. Projects Teal Electronics | E-Commerce | ReactJS,ExpressJS,MongoDB| April 2025 | View Project · Developed an E-Commerce Web Application with features like Search,Filtering,Cart Handling etc. · Created different pages including Products Page,Wishlist,Cart,User Profile using React Router. · Can Add Products to Cart,Wishlist and can place orders directly.Orders are saved to Database. · Can filter and sort products based on price,ratings,categories etc using hooks like useState and useRef. · Created Alerts and Loading Messages using React Hooks like useEffect. · User Profile Page to view and edit Addresses, Order History. · Made APIs and Routes using ExpressJS to fetch products and other data from database.. · Designed different schemas like Products,Orders etc using Referencing. Meetup App | ReactJS,ExpressJS,MongoDb,Bootstrap | January 202 5 | View Project · An App where different types of events are listed. Used Bootstrap and CSS for designing. · Feature to search and filter events based on type,title,tags. Used React Hooks and React Router to navigate. · Created APIs using Express to retrieve data from MongoDB Players Management App | ReactJS | December 202 4 | View Project · Used React Router to navigate through different routes within the app. · Can filter players through their teams. Used React Hooks for this feature. EDUCATION B. Tech in C omputer Science & Engineering | 2020-2024 | JAMIA HAMDARD New Delhi C LASS XII | 2018-2019| SHARDEIN SCHOOL, MUZAFFARNAGAR | SCORE: 89% CLASS X | 2016-2017| SHARDEIN SCHOOL, MUZAFFARNAGAR | SCORE: CGPA 10",
//   "message": " File uploaded and parsed successfully "
// };

const text = "Piyush   Tiwari    (+91) 7566081799   |      tiwaripiyush89555@gmail.com   |      PiyushTiwari684   |      piyush-tiwari-45b555218  Summary  Proactive and results‑driven B.Tech Electrical Engineering student with a 73.17% score, specializing in frontend development. Proficient in HTML, CSS, JavaScript, and React.js, with hands‑on experience in MongoDB, Postman, Node.js, and Express. Skilled in building impactful projects that showcase strong problem‑solving abilities. Recognized for academic excellence, leadership in extracurricular activities, and notable achievements in both sports and academics.  Education  Maharaja Agrasen Institute of Technology   Rohini, Delhi  B.TECH. iN ELECTRiCAL AND ELECTRONiCS ENGEENEERiNG   Nov. 2021 ‑ till 2025  •   Percentage‑73.17%  City Central School   Bhind, Madhya Pradesh  (CLASS XII)   Mar. 2019 ‑ July 2020  •   Percentage‑70%  Project  Food Delivery App (Nodejs,Express,MongoDB)   Github  •   Developed:   Built a complete backend for a food delivery app using Node.js. Implemented authentication with tokens and cookies, file uploads with Multer and Cloudinary, and database operations for managing users, food items, cart, and order status •   Key Features:   Developed a scalable food delivery app backend with JWT and cookie‑based auth, Cloudinary file uploads, and full cart/order management using Node.js and MongoDB.  Restaurants WebApp (React.js, Express, Node.js,Mongodb)   Github  •   Engineered:   Developed a dynamic and user‑friendly restaurant booking web application using the MERN stack (MongoDB, Express, React.js, and Node.js). The application allows users to browse restaurants, view available tables, and make reservations seamlessly. •   Key Features:   Utilized as the database to store user information, restaurant details, and booking data.  Work Experience  Inspiration Academy   Onsite  EDUCATOR   Oct 2022 ‑ April 2024  •   Worked on:   Overall Development of Students.  •   Implemented:   My leadership skills to mentor students .  Chegg   Remote  SUBJECT MATTER EXPERT   Mar 2023 ‑ Jun 2023  •   Worked on:   Resolved Students Doubts in multiple subjects through online platform.  •   Solved:   200+ question solved in multiple subjects..  •   Mentored:   Over 100+ students as a Chegg Educator.  Skills  •   Technical Skills :   Reactjs,CSS,Bootstrap, Git,GitHub„Nodejs,Express,MongoDB,Mongoose,Postman,Thunder client  •   Coursework :   Data Structures and Algorithms,Full Stack Development  •   Languages :   C++,JavaScript, HTML  MAY 29, 2025   PiYUSH TiWARi ·   RÉSUMÉ"

const regexResult = extractWithRegex(text);
console.log("Text Result :: ",text);
console.log("Text.extractedText :: ",text.extractedText);

console.log("Regex extraction result", regexResult);

