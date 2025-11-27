+ Controllers - Moved Piyush proctoring controller files to controllers/v1/proctoring-assesment

+ Configs - Moved all config files from Piyush to main config..altered the db.js added piyush versions

+ Middlewares - Moved Error Handler from Piyush middleware to main middleware

+ Routes-Moved routes from Piyush to main routes subfolder

+ Services-Moved services(assemblyAiService) from Piyush to main services

+ Utils - Moved from Piyush to main utils

+ Uploads - Moved from Piyush to main uploads

+ Package Json - Merged package.json

+ Prisma - Moved seed.js

+ Moved original app.js into dummy-app.js and index.js in core folder temporarily

+ Moved Piyush app.js into main app.js

## App.js and Server.js remaining


C-1) Written all the code in the centralised app.js file 
C-2) Changed the folder structure of utils and maded all the utilities at the root of the utils folder
C-3) Done some changes in the routes folder also there were 2 different folders like core folder and proctoring-assessment folder and maintained a centered route file which will directly connected to the app.js file 
C-4) Since there are three different file serving the same logic for multer configuration , bringing all the file code from these file into single file 
C-5) There were two middleware for error handling now bring those 2 middleware code into a single file

