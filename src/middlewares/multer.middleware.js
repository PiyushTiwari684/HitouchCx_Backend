// import multer from "multer";
// import {CloudinaryStorage} from "multer-storage-cloudinary";
// import {v2 as cloudinary} from "cloudinary";

// const storage = new CloudinaryStorage({
//     cloudinary,
//     parama: {
//         folder : "resumes",
//         resource_type: "raw",
//         allowed_formats: ["pdf","doc","docx"],

//         public_id: (req,file) =>{
//             const originalName = file.originalName.split(".")[0];
//             return `${originalName}-${Date.now()}`
//         }
//     }
// })

// const upload = multer({
//     storage,
//     limits: {fileSize: 10* 1024 *1024} 
// })

// export default upload;




import multer from "multer";

const storage = multer.diskStorage({
    destination : (req,file,cb) => cb(null,"uploads/"),
    filename : (req,file,cb) => cb(null,Date.now() + "-" + file.originalname)
});

const upload = multer({storage});

export default upload;


