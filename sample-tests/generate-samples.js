const fs = require('fs');
const path = require('path');
const AdmZip = require('../server/node_modules/adm-zip');

const SAMPLES_DIR = path.resolve(__dirname);

// Helper to generate a minimal valid 1-second WAV audio file
function createWavBuffer() {
  const sampleRate = 8000;
  const numSamples = sampleRate * 2; // 2 seconds
  const buffer = Buffer.alloc(44 + numSamples);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate, 28); // ByteRate
  buffer.writeUInt16LE(1, 32); // BlockAlign
  buffer.writeUInt16LE(8, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples, 40);

  // 440Hz tone
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const val = 128 + Math.floor(60 * Math.sin(2 * Math.PI * 440 * t));
    buffer.writeUInt8(val, 44 + i);
  }

  return buffer;
}

// 1. Generate Listening Test 1 (ZIP package)
function buildListening1() {
  const zip = new AdmZip();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IELTS Academic Listening - Test 1</title>
  <link rel="stylesheet" href="css/test.css">
</head>
<body>
  <div class="test-header">
    <div class="test-title">IELTS Academic Listening — Practice Test 1</div>
    <div class="audio-panel">
      <span>Audio Track:</span>
      <audio controls src="audio/track.wav" id="audioPlayer"></audio>
    </div>
  </div>

  <div class="test-body">
    <div class="instructions-box">
      <strong>SECTION 1: Questions 1-10</strong><br>
      Complete the notes below. Write <em>NO MORE THAN TWO WORDS AND/OR A NUMBER</em> for each answer.
    </div>

    <div class="diagram-container">
      <img src="images/diagram.svg" alt="Accommodation Floorplan" style="max-width:320px; border:1px solid #ccc;">
    </div>

    <form id="listeningForm">
      <table class="q-table">
        <tr><td>1. Customer Name:</td><td><input type="text" name="q1" placeholder="Answer 1"></td></tr>
        <tr><td>2. Contact Phone:</td><td><input type="text" name="q2" placeholder="Answer 2"></td></tr>
        <tr><td>3. Preferred Room Type:</td><td><input type="text" name="q3" placeholder="Answer 3"></td></tr>
        <tr><td>4. Check-in Date:</td><td><input type="text" name="q4" placeholder="Answer 4"></td></tr>
        <tr><td>5. Deposit Amount:</td><td><input type="text" name="q5" placeholder="Answer 5"></td></tr>
      </table>

      <div class="instructions-box" style="margin-top:20px;">
        <strong>SECTION 2: Questions 6-10</strong><br>
        Choose the correct letter, <strong>A</strong>, <strong>B</strong>, or <strong>C</strong>.
      </div>
      <div class="mcq-group">
        <p><strong>6. The new visitor center opens at:</strong></p>
        <label><input type="radio" name="q6" value="A"> A) 8:30 AM</label><br>
        <label><input type="radio" name="q6" value="B"> B) 9:00 AM</label><br>
        <label><input type="radio" name="q6" value="C"> C) 9:30 AM</label>
      </div>
      <div class="mcq-group">
        <p><strong>7. Parking facilities are located behind:</strong></p>
        <label><input type="radio" name="q7" value="A"> A) Main Hall</label><br>
        <label><input type="radio" name="q7" value="B"> B) East Wing</label><br>
        <label><input type="radio" name="q7" value="C"> C) Sports Pavilion</label>
      </div>

      <div class="submit-bar">
        <button type="button" id="submitBtn" class="btn-submit">Submit Section</button>
      </div>
    </form>
  </div>

  <script src="js/test.js"></script>
</body>
</html>`;

  const css = `body {
  font-family: Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f8fafc;
  color: #1e293b;
}
.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 20px;
}
.test-title {
  font-size: 18px;
  font-weight: bold;
  color: #0f172a;
}
.audio-panel {
  display: flex;
  align-items: center;
  gap: 10px;
}
.instructions-box {
  background: #eff6ff;
  border-left: 4px solid #2563eb;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}
.q-table td {
  padding: 8px 12px;
  font-size: 14px;
}
.q-table input[type="text"] {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 6px 10px;
  width: 220px;
}
.mcq-group {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 12px;
}
.submit-bar {
  margin-top: 24px;
  text-align: right;
}
.btn-submit {
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 10px 22px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}
.btn-submit:hover {
  background: #1d4ed8;
}`;

  const js = `document.getElementById('submitBtn').addEventListener('click', function() {
  const form = document.getElementById('listeningForm');
  let filledCount = 0;
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    if ((input.type === 'text' && input.value.trim()) || (input.type === 'radio' && input.checked)) {
      filledCount++;
    }
  });

  // Emit standard IELTS completion postMessage
  const score = Math.min(40, filledCount * 5 + 10);
  const band = (score / 40 * 9).toFixed(1);

  if (window.parent) {
    window.parent.postMessage({
      type: 'IELTS_TEST_COMPLETE',
      section: 'LISTENING',
      rawScore: score,
      maxScore: 40,
      bandScore: parseFloat(band),
      resultData: { filled: filledCount, total: 40 }
    }, '*');
  }

  alert('Section submitted! Score: ' + score + '/40 (Est. Band ' + band + ')');
});`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
  <rect width="300" height="200" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/>
  <rect x="20" y="20" width="100" height="60" fill="#e2e8f0" stroke="#64748b"/>
  <text x="35" y="55" font-family="Arial" font-size="12" fill="#334155">Reception</text>
  <rect x="140" y="20" width="140" height="60" fill="#e2e8f0" stroke="#64748b"/>
  <text x="175" y="55" font-family="Arial" font-size="12" fill="#334155">Dining Hall</text>
  <rect x="20" y="100" width="260" height="80" fill="#fed7aa" stroke="#f97316"/>
  <text x="90" y="145" font-family="Arial" font-size="14" fill="#9a3412">Auditorium & Stage</text>
</svg>`;

  zip.addFile('index.html', Buffer.from(html, 'utf8'));
  zip.addFile('css/test.css', Buffer.from(css, 'utf8'));
  zip.addFile('js/test.js', Buffer.from(js, 'utf8'));
  zip.addFile('images/diagram.svg', Buffer.from(svg, 'utf8'));
  zip.addFile('audio/track.wav', createWavBuffer());

  zip.writeZip(path.join(SAMPLES_DIR, 'listening-1.zip'));
  console.log('Created listening-1.zip');
}

// 2. Generate Listening Test 2 (ZIP package)
function buildListening2() {
  const zip = new AdmZip();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IELTS Academic Listening - Test 2</title>
  <link rel="stylesheet" href="css/test.css">
</head>
<body>
  <div class="test-header">
    <div class="test-title">IELTS Academic Listening — Practice Test 2</div>
    <div class="audio-panel">
      <span>Audio Track:</span>
      <audio controls src="audio/track.wav" id="audioPlayer"></audio>
    </div>
  </div>

  <div class="test-body">
    <div class="instructions-box">
      <strong>SECTION 1: Questions 1-5</strong><br>
      Campus Bicycle Rental Scheme Registration.
    </div>

    <form id="listeningForm2">
      <table class="q-table">
        <tr><td>1. Student ID:</td><td><input type="text" name="q1" placeholder="e.g. STU-9902"></td></tr>
        <tr><td>2. Card Type:</td><td><input type="text" name="q2" placeholder="e.g. Gold Pass"></td></tr>
        <tr><td>3. Helmet Size:</td><td><input type="text" name="q3" placeholder="e.g. Medium"></td></tr>
        <tr><td>4. Emergency Contact:</td><td><input type="text" name="q4" placeholder="Name"></td></tr>
      </table>

      <div class="instructions-box" style="margin-top:20px;">
        <strong>SECTION 2: Questions 5-10</strong><br>
        Campus Map Orientation.
      </div>
      <img src="images/map.svg" alt="Campus Map" style="max-width:320px; border:1px solid #ccc; margin-bottom:12px;">

      <div class="mcq-group">
        <p><strong>5. The bicycle service bay is situated near:</strong></p>
        <label><input type="radio" name="q5" value="A"> A) Science Lab</label><br>
        <label><input type="radio" name="q5" value="B"> B) Central Library</label><br>
        <label><input type="radio" name="q5" value="C"> C) North Gate</label>
      </div>

      <div class="submit-bar">
        <button type="button" id="submitBtn2" class="btn-submit">Submit Section</button>
      </div>
    </form>
  </div>

  <script src="js/test.js"></script>
</body>
</html>`;

  const css = `body {
  font-family: Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f8fafc;
  color: #1e293b;
}
.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 20px;
}
.test-title {
  font-size: 18px;
  font-weight: bold;
  color: #0f172a;
}
.instructions-box {
  background: #f0fdf4;
  border-left: 4px solid #16a34a;
  padding: 12px 16px;
  font-size: 14px;
  margin-bottom: 16px;
}
.q-table td {
  padding: 8px 12px;
  font-size: 14px;
}
.q-table input[type="text"] {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 6px 10px;
  width: 220px;
}
.mcq-group {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 12px;
}
.submit-bar {
  margin-top: 24px;
  text-align: right;
}
.btn-submit {
  background: #16a34a;
  color: #ffffff;
  border: none;
  padding: 10px 22px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}`;

  const js = `document.getElementById('submitBtn2').addEventListener('click', function() {
  const form = document.getElementById('listeningForm2');
  let filledCount = 0;
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    if ((input.type === 'text' && input.value.trim()) || (input.type === 'radio' && input.checked)) {
      filledCount++;
    }
  });

  const score = Math.min(40, filledCount * 6 + 12);
  const band = (score / 40 * 9).toFixed(1);

  if (window.parent) {
    window.parent.postMessage({
      type: 'IELTS_TEST_COMPLETE',
      section: 'LISTENING',
      rawScore: score,
      maxScore: 40,
      bandScore: parseFloat(band),
      resultData: { filled: filledCount, testNumber: 2 }
    }, '*');
  }

  alert('Section submitted! Score: ' + score + '/40 (Est. Band ' + band + ')');
});`;

  const mapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
  <rect width="300" height="200" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
  <circle cx="60" cy="60" r="30" fill="#a7f3d0" stroke="#059669"/>
  <text x="40" y="65" font-family="Arial" font-size="12" fill="#065f46">North Gate</text>
  <rect x="160" y="40" width="110" height="50" fill="#d1fae5" stroke="#059669"/>
  <text x="175" y="70" font-family="Arial" font-size="12" fill="#065f46">Science Lab</text>
  <rect x="80" y="120" width="150" height="60" fill="#6ee7b7" stroke="#047857"/>
  <text x="105" y="155" font-family="Arial" font-size="13" font-weight="bold" fill="#064e3b">Central Library</text>
</svg>`;

  zip.addFile('index.html', Buffer.from(html, 'utf8'));
  zip.addFile('css/test.css', Buffer.from(css, 'utf8'));
  zip.addFile('js/test.js', Buffer.from(js, 'utf8'));
  zip.addFile('images/map.svg', Buffer.from(mapSvg, 'utf8'));
  zip.addFile('audio/track.wav', createWavBuffer());

  zip.writeZip(path.join(SAMPLES_DIR, 'listening-2.zip'));
  console.log('Created listening-2.zip');
}

// 3. Generate Reading Test 1 (ZIP package)
function buildReading1() {
  const zip = new AdmZip();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IELTS Academic Reading - Test 1</title>
  <link rel="stylesheet" href="css/test.css">
</head>
<body>
  <div class="exam-container">
    <div class="reading-passage">
      <h2>READING PASSAGE 1</h2>
      <h3>The Secrets of Ancient Navigation</h3>
      <p>For thousands of years, Pacific Islanders crossed vast expanses of open ocean without magnetic compasses, charts, or navigational chronometers. By keenly observing natural phenomena—the motion of swells, flight patterns of pelagic birds, and rising azimuths of stars—they traveled across thousands of miles between minute islands.</p>
      <p>Modern archaeological and genetic findings suggest that voyagers reached Remote Oceania around 3,000 years ago. Recent computational drift simulations demonstrate that these voyages were not accidental drifts caused by seasonal storms, but deliberate navigation against dominant trade winds, allowing safe return journeys.</p>
      <p>The zenith star technique was one of their most dependable methods. A navigator knew that a particular star passed directly overhead at the latitude of their destination island. By maintaining course until that celestial body reached zenith, the vessel could then turn east or west along the correct line of latitude.</p>
    </div>

    <div class="questions-panel">
      <h3>Questions 1-5</h3>
      <p>Do the following statements agree with the information given in Reading Passage 1?</p>
      <div class="info-tag">Write <strong>TRUE</strong>, <strong>FALSE</strong>, or <strong>NOT GIVEN</strong>.</div>

      <div class="q-item">
        <p><strong>1.</strong> Pacific navigators relied on specialized metal instruments.</p>
        <select name="rq1">
          <option value="">Select answer...</option>
          <option value="TRUE">TRUE</option>
          <option value="FALSE">FALSE</option>
          <option value="NOT GIVEN">NOT GIVEN</option>
        </select>
      </div>

      <div class="q-item">
        <p><strong>2.</strong> Modern computer simulations proved voyages were intentional.</p>
        <select name="rq2">
          <option value="">Select answer...</option>
          <option value="TRUE">TRUE</option>
          <option value="FALSE">FALSE</option>
          <option value="NOT GIVEN">NOT GIVEN</option>
        </select>
      </div>

      <div class="q-item">
        <p><strong>3.</strong> The zenith star method was solely used during winter months.</p>
        <select name="rq3">
          <option value="">Select answer...</option>
          <option value="TRUE">TRUE</option>
          <option value="FALSE">FALSE</option>
          <option value="NOT GIVEN">NOT GIVEN</option>
        </select>
      </div>

      <div style="margin-top:20px; text-align:right;">
        <button id="readingSubmitBtn" class="btn-submit">Submit Reading Section</button>
      </div>
    </div>
  </div>
  <script src="js/test.js"></script>
</body>
</html>`;

  const css = `body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  margin: 0;
  padding: 0;
  background: #f1f5f9;
}
.exam-container {
  display: flex;
  height: 100vh;
}
.reading-passage {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  background: #ffffff;
  border-right: 2px solid #cbd5e1;
  font-size: 15px;
  line-height: 1.7;
}
.reading-passage h2 { font-size: 16px; color: #64748b; margin-top: 0; }
.reading-passage h3 { font-size: 20px; color: #0f172a; margin-bottom: 16px; }
.questions-panel {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  background: #f8fafc;
}
.info-tag {
  background: #e0f2fe;
  color: #0369a1;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 16px;
}
.q-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 12px;
}
select {
  padding: 6px 12px;
  border: 1px solid #94a3b8;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 6px;
}
.btn-submit {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}`;

  const js = `document.getElementById('readingSubmitBtn').addEventListener('click', function() {
  const selects = document.querySelectorAll('select');
  let answered = 0;
  selects.forEach(s => { if (s.value) answered++; });

  const rawScore = 32;
  const band = 7.5;

  if (window.parent) {
    window.parent.postMessage({
      type: 'IELTS_TEST_COMPLETE',
      section: 'READING',
      rawScore: rawScore,
      maxScore: 40,
      bandScore: band,
      resultData: { testNumber: 1, answered: answered }
    }, '*');
  }

  alert('Reading Section completed! Recorded Band: ' + band);
});`;

  zip.addFile('index.html', Buffer.from(html, 'utf8'));
  zip.addFile('css/test.css', Buffer.from(css, 'utf8'));
  zip.addFile('js/test.js', Buffer.from(js, 'utf8'));

  zip.writeZip(path.join(SAMPLES_DIR, 'reading-1.zip'));
  console.log('Created reading-1.zip');
}

// 4. Generate Reading Test 2 (Single standalone HTML file)
function buildReading2() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IELTS Academic Reading - Test 2</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; background: #f8fafc; }
    .split { display: flex; height: 100vh; }
    .passage { flex: 1; padding: 24px 30px; overflow-y: auto; background: #ffffff; border-right: 2px solid #e2e8f0; line-height: 1.65; }
    .questions { flex: 1; padding: 24px 30px; overflow-y: auto; background: #f8fafc; }
    .card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; }
    .btn { background: #0d9488; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <div class="split">
    <div class="passage">
      <h2>READING PASSAGE 2</h2>
      <h3>Biomimicry in Modern Civil Engineering</h3>
      <p>Biomimicry is the design and production of materials, structures, and systems that are modeled on biological entities and processes. From self-cooling architectural complexes modeled on termite mounds to ultra-strong lightweight polymers derived from spider silk, nature continues to offer time-tested blueprints.</p>
      <p>The Eastgate Centre in Harare, Zimbabwe, serves as an archetype of passive climate architecture. Architect Mick Pearce collaborated with engineers to mimic the self-cooling mounds of Macrotermes termites, reducing air-conditioning energy consumption by over 90% compared to traditional buildings of similar volume.</p>
    </div>
    <div class="questions">
      <h3>Questions 1-3: Matching Information</h3>
      <div class="card">
        <p><strong>1.</strong> The Eastgate Centre achieved energy savings of more than:</p>
        <label><input type="radio" name="q1" value="A"> A) 50%</label><br>
        <label><input type="radio" name="q1" value="B"> B) 75%</label><br>
        <label><input type="radio" name="q1" value="C"> C) 90%</label>
      </div>
      <div class="card">
        <p><strong>2.</strong> The primary termite genus studied for thermal dynamics was:</p>
        <label><input type="radio" name="q2" value="A"> A) Macrotermes</label><br>
        <label><input type="radio" name="q2" value="B"> B) Reticulitermes</label><br>
        <label><input type="radio" name="q2" value="C"> C) Cryptotermes</label>
      </div>
      <button class="btn" id="subBtn2">Finish Section</button>
    </div>
  </div>

  <script>
    document.getElementById('subBtn2').addEventListener('click', function() {
      if (window.parent) {
        window.parent.postMessage({
          type: 'IELTS_TEST_COMPLETE',
          section: 'READING',
          rawScore: 35,
          maxScore: 40,
          bandScore: 8.0,
          resultData: { testNumber: 2 }
        }, '*');
      }
      alert('Reading Test 2 submitted successfully! Score: 35/40 (Band 8.0)');
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(SAMPLES_DIR, 'reading-2.html'), html, 'utf8');
  console.log('Created reading-2.html');
}

// 5. Generate Writing Test 1 (ZIP package with chart image and word counter)
function buildWriting1() {
  const zip = new AdmZip();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IELTS Academic Writing - Test 1</title>
  <link rel="stylesheet" href="css/test.css">
</head>
<body>
  <div class="container">
    <div class="task-box">
      <h2>WRITING TASK 1</h2>
      <p>You should spend about 20 minutes on this task.</p>
      <div class="prompt-card">
        <p><strong>The bar chart below shows global renewable electricity generation by source between 2015 and 2025.</strong></p>
        <p><em>Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.</em></p>
        <img src="images/chart.svg" alt="Renewable Energy Chart" style="max-width:380px; margin-top:10px;">
      </div>

      <div class="editor-area">
        <textarea id="task1Text" placeholder="Write your Task 1 response here..."></textarea>
        <div class="counter-bar">Word count: <span id="t1Count">0</span> words (Minimum: 150)</div>
      </div>
    </div>

    <div class="task-box" style="margin-top:30px;">
      <h2>WRITING TASK 2</h2>
      <p>You should spend about 40 minutes on this task.</p>
      <div class="prompt-card">
        <p><strong>Some educational researchers argue that digital devices in classrooms distract pupils and reduce learning outcomes, while others believe they are essential for future literacy.</strong></p>
        <p><em>Discuss both views and give your own opinion. Give reasons for your answer and include relevant examples. Write at least 250 words.</em></p>
      </div>

      <div class="editor-area">
        <textarea id="task2Text" placeholder="Write your Task 2 essay here..."></textarea>
        <div class="counter-bar">Word count: <span id="t2Count">0</span> words (Minimum: 250)</div>
      </div>

      <div style="text-align:right; margin-top:20px;">
        <button id="writingSubmitBtn" class="btn-submit">Submit Writing Test</button>
      </div>
    </div>
  </div>

  <script src="js/test.js"></script>
</body>
</html>`;

  const css = `body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  margin: 0;
  padding: 24px;
  background: #f8fafc;
  color: #1e293b;
}
.container { max-width: 900px; margin: 0 auto; }
.task-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
}
.prompt-card {
  background: #f1f5f9;
  border-left: 4px solid #6366f1;
  padding: 14px 18px;
  border-radius: 4px;
  margin-bottom: 18px;
  font-size: 14px;
}
textarea {
  width: 100%;
  height: 200px;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
}
.counter-bar {
  font-size: 13px;
  color: #64748b;
  margin-top: 6px;
  font-weight: 500;
}
.btn-submit {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}`;

  const js = `function updateCount(inputId, countId) {
  const el = document.getElementById(inputId);
  const countEl = document.getElementById(countId);
  el.addEventListener('input', function() {
    const text = el.value.trim();
    const words = text ? text.split(/\\s+/).length : 0;
    countEl.textContent = words;
  });
}

updateCount('task1Text', 't1Count');
updateCount('task2Text', 't2Count');

document.getElementById('writingSubmitBtn').addEventListener('click', function() {
  const t1 = document.getElementById('task1Text').value;
  const t2 = document.getElementById('task2Text').value;
  const t1Words = t1.trim() ? t1.trim().split(/\\s+/).length : 0;
  const t2Words = t2.trim() ? t2.trim().split(/\\s+/).length : 0;

  if (window.parent) {
    window.parent.postMessage({
      type: 'IELTS_TEST_COMPLETE',
      section: 'WRITING',
      bandScore: 7.0,
      resultData: {
        task1Words: t1Words,
        task2Words: t2Words,
        submittedAt: new Date().toISOString()
      }
    }, '*');
  }

  alert('Writing Test 1 submitted successfully! Recorded Band 7.0 (Task 1: ' + t1Words + 'w, Task 2: ' + t2Words + 'w)');
});`;

  const chartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 180" width="350" height="180">
  <rect width="350" height="180" fill="#f8fafc" stroke="#cbd5e1"/>
  <line x1="40" y1="140" x2="330" y2="140" stroke="#64748b" stroke-width="2"/>
  <line x1="40" y1="20" x2="40" y2="140" stroke="#64748b" stroke-width="2"/>
  <!-- Bar 1: Solar -->
  <rect x="65" y="60" width="40" height="80" fill="#3b82f6"/>
  <text x="70" y="155" font-family="Arial" font-size="11" fill="#475569">Solar</text>
  <!-- Bar 2: Wind -->
  <rect x="135" y="40" width="40" height="100" fill="#10b981"/>
  <text x="140" y="155" font-family="Arial" font-size="11" fill="#475569">Wind</text>
  <!-- Bar 3: Hydro -->
  <rect x="205" y="30" width="40" height="110" fill="#6366f1"/>
  <text x="210" y="155" font-family="Arial" font-size="11" fill="#475569">Hydro</text>
  <!-- Bar 4: Bio -->
  <rect x="275" y="90" width="40" height="50" fill="#f59e0b"/>
  <text x="285" y="155" font-family="Arial" font-size="11" fill="#475569">Bio</text>
</svg>`;

  zip.addFile('index.html', Buffer.from(html, 'utf8'));
  zip.addFile('css/test.css', Buffer.from(css, 'utf8'));
  zip.addFile('js/test.js', Buffer.from(js, 'utf8'));
  zip.addFile('images/chart.svg', Buffer.from(chartSvg, 'utf8'));

  zip.writeZip(path.join(SAMPLES_DIR, 'writing-1.zip'));
  console.log('Created writing-1.zip');
}

// 6. Generate Writing Test 2 (Single standalone HTML file)
function buildWriting2() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IELTS Academic Writing - Test 2</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #fdfefe; }
    .box { max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
    .task-title { font-size: 16px; font-weight: bold; color: #111827; }
    .instruction { background: #f3f4f6; border-left: 4px solid #4b5563; padding: 12px 16px; margin: 12px 0; font-size: 14px; }
    textarea { width: 100%; height: 180px; box-sizing: border-box; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-family: inherit; font-size: 14px; }
    .word-count { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .submit-btn { background: #1f2937; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <div class="box">
    <div class="task-title">WRITING TASK 1</div>
    <div class="instruction">
      <strong>The diagram illustrates the process of producing recycled paper.</strong><br>
      Write a report describing the stages of collection, pulping, de-inking, and pressing. Write at least 150 words.
    </div>
    <textarea id="w2t1" placeholder="Write Task 1 report..."></textarea>
    <div class="word-count">Words: <span id="c1">0</span></div>
  </div>

  <div class="box">
    <div class="task-title">WRITING TASK 2</div>
    <div class="instruction">
      <strong>Some people think that university education should be free for all students. To what extent do you agree or disagree?</strong><br>
      Write at least 250 words.
    </div>
    <textarea id="w2t2" placeholder="Write Task 2 essay..."></textarea>
    <div class="word-count">Words: <span id="c2">0</span></div>
    <div style="text-align:right; margin-top:16px;">
      <button class="submit-btn" id="w2sub">Submit Writing Test</button>
    </div>
  </div>

  <script>
    function setup(id, countId) {
      const area = document.getElementById(id);
      const span = document.getElementById(countId);
      area.addEventListener('input', function() {
        const words = area.value.trim() ? area.value.trim().split(/\\s+/).length : 0;
        span.textContent = words;
      });
    }
    setup('w2t1', 'c1');
    setup('w2t2', 'c2');

    document.getElementById('w2sub').addEventListener('click', function() {
      if (window.parent) {
        window.parent.postMessage({
          type: 'IELTS_TEST_COMPLETE',
          section: 'WRITING',
          bandScore: 7.5,
          resultData: { testNumber: 2 }
        }, '*');
      }
      alert('Writing Test 2 submitted!');
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(SAMPLES_DIR, 'writing-2.html'), html, 'utf8');
  console.log('Created writing-2.html');
}

// Execute builders
buildListening1();
buildListening2();
buildReading1();
buildReading2();
buildWriting1();
buildWriting2();
console.log('All 6 sample test packages successfully created in sample-tests/');
