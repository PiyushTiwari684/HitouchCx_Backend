const https = require('https');
const fs = require('fs');
const path = require('path');

// Use vladmandic/face-api models (compatible with @vladmandic/face-api package)
const MODEL_BASE_URL = 'https://vladmandic.github.io/face-api/model';
const MODEL_DIR = path.join(__dirname, '..', 'public', 'models', 'face-api');

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1'
];

console.log('📦 Downloading face-api.js models...\n');

// Create directory if it doesn't exist
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
  console.log('✅ Created directory:', MODEL_DIR);
}

let completed = 0;

// Download each file
files.forEach(file => {
  const url = `${MODEL_BASE_URL}/${file}`;
  const dest = path.join(MODEL_DIR, file);

  console.log(`⏳ Downloading ${file}...`);

  https.get(url, (response) => {
    if (response.statusCode === 302 || response.statusCode === 301) {
      // Follow redirect
      https.get(response.headers.location, (redirectResponse) => {
        const fileStream = fs.createWriteStream(dest);
        redirectResponse.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          completed++;
          console.log(`✅ ${file} downloaded (${completed}/${files.length})`);

          if (completed === files.length) {
            console.log('\n🎉 All models downloaded successfully!');
            console.log(`📁 Models location: ${MODEL_DIR}`);
          }
        });
      }).on('error', (err) => {
        console.error(`❌ Error downloading ${file}:`, err.message);
      });
    } else {
      const fileStream = fs.createWriteStream(dest);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        completed++;
        console.log(`✅ ${file} downloaded (${completed}/${files.length})`);

        if (completed === files.length) {
          console.log('\n🎉 All models downloaded successfully!');
          console.log(`📁 Models location: ${MODEL_DIR}`);
        }
      });
    }
  }).on('error', (err) => {
    console.error(`❌ Error downloading ${file}:`, err.message);
  });
});
