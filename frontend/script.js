// ====== FRONTEND SCRIPT FOR JUDGE0 CLONE IDE ======

// Replace the URL below with your own AWS Lambda function URL
// const lambdaUrl = "https://uflyndhnr4oprxiymevepyha3a0wtpkq.lambda-url.ap-southeast-2.on.aws/"; 

// ========== Language Setup ==========
const languages = [
  { id: 71, name: "Python 3" },
  { id: 63, name: "JavaScript Node" },
  { id: 54, name: "C++ (GCC)" },
  { id: 62, name: "Java (OpenJDK)" },
  { id: 50, name: "C (GCC)" },
  { id: 68, name: "PHP" },
  { id: 72, name: "Ruby" },
  { id: 73, name: "Rust" },
  { id: 60, name: "Go" },
  { id: 74, name: "TypeScript" }
];

// Populate language dropdown
const langSelect = document.getElementById("languageSelect");
languages.forEach(l => {
  const opt = document.createElement("option");
  opt.value = l.id;
  opt.textContent = l.name;
  langSelect.appendChild(opt);
});

// Default samples
const samples = {
  71: `print("Hello, Judge0!")`,
  63: `console.log("Hello, Judge0!");`,
  54: `#include <iostream>\nint main(){ std::cout<<"Hello C++!"; return 0; }`,
  62: `class Main{ public static void main(String[] a){ System.out.println("Hello Java!"); } }`,
  50: `#include <stdio.h>\nint main(){ printf("Hello C!"); return 0; }`,
  68: `<?php echo "Hello PHP!"; ?>`,
  72: `puts "Hello Ruby!"`,
  73: `fn main(){ println!("Hello Rust!"); }`,
  60: `package main\nimport "fmt"\nfunc main(){ fmt.Println("Hello Go!") }`,
  74: `console.log("Hello TypeScript (compiled)");`
};

// ========== Monaco Editor ==========
require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs" }});
let editor;

require(["vs/editor/editor.main"], function () {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: samples[71],
    language: "python",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false }
  });
});

// Map language ids to Monaco languages
function idToMonacoLang(id){
  id = Number(id);
  if([71].includes(id)) return "python";
  if([63,74].includes(id)) return "javascript";
  if([54].includes(id)) return "cpp";
  if([62].includes(id)) return "java";
  if([50].includes(id)) return "c";
  if([68].includes(id)) return "php";
  if([72].includes(id)) return "ruby";
  if([73].includes(id)) return "rust";
  if([60].includes(id)) return "go";
  return "plaintext";
}

// Update editor when language changes
langSelect.addEventListener("change", () => {
  const id = langSelect.value;
  if(editor) {
    editor.setValue(samples[id] || "");
    const lang = idToMonacoLang(id);
    monaco.editor.setModelLanguage(editor.getModel(), lang);
  }
});

// ========== Run Button ==========
const runBtn = document.getElementById("runBtn");
const outputArea = document.getElementById("outputArea");
const inputArea = document.getElementById("inputArea");
const statusText = document.getElementById("statusText");
const execTimeEl = document.getElementById("execTime");
const memoryEl = document.getElementById("memoryUsed");

runBtn.addEventListener("click", async () => {
  const source = editor ? editor.getValue() : "";
  const language_id = Number(langSelect.value);
  const stdin = inputArea.value || "";

  try {
    statusText.textContent = "Status: running...";
    outputArea.textContent = "Running...";

    const res = await fetch(lambdaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_code: source, language_id, stdin })
    });

    const data = await res.json();
    const out = data.stdout || data.stderr || data.compile_output || "(no output)";
    outputArea.textContent = out;
    statusText.textContent = "Status: " + (data.status?.description || "done");
    execTimeEl.textContent = "Execution time: " + (data.time ?? "-");
    memoryEl.textContent = "Memory: " + (data.memory ?? "-");
  } catch (err) {
    outputArea.textContent = "Error: " + err.message;
    statusText.textContent = "Status: error";
  }
  if (editor) editor.layout();
});

// ========== Theme Toggle ==========
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  if (document.body.classList.contains("light-theme")) {
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
    monaco.editor.setTheme("vs");
  } else {
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
    monaco.editor.setTheme("vs-dark");
  }
});

// ============================================
//          RESIZE HANDLES (Synced Logic)
// ============================================

const gutter = document.getElementById("gutter");
const leftPane = document.querySelector(".left-pane");
const rightPane = document.querySelector(".right-pane");
const gutterV = document.getElementById("gutterV");
const outputSection = document.getElementById("outputSection");
const inputSection = document.getElementById("inputSection");

let isResizingH = false;
let isResizingV = false;

// --- Horizontal Resize (same logic style as vertical one) ---
gutter.addEventListener("mousedown", (e) => {
  e.preventDefault();
  isResizingH = true;
  document.body.style.cursor = "col-resize";
});

window.addEventListener("mousemove", (e) => {
  if (!isResizingH) return;
  const rect = document.querySelector(".split-container").getBoundingClientRect();
  const totalWidth = rect.width;
  let leftWidth = e.clientX - rect.left;

  const minLeft = 220;
  const maxLeft = totalWidth - 320;
  if (leftWidth < minLeft) leftWidth = minLeft;
  if (leftWidth > maxLeft) leftWidth = maxLeft;

  leftPane.style.flex = "none";
  leftPane.style.width = leftWidth + "px";
  rightPane.style.flex = "1";

  if (editor) editor.layout();
});

window.addEventListener("mouseup", () => {
  if (isResizingH || isResizingV) {
    isResizingH = false;
    isResizingV = false;
    document.body.style.cursor = "";
    if (editor) editor.layout();
  }
});

// --- Vertical Resize (Output ↕ Input) ---
gutterV.addEventListener("mousedown", (e) => {
  e.preventDefault();
  isResizingV = true;
  document.body.style.cursor = "row-resize";
});

window.addEventListener("mousemove", (e) => {
  if (!isResizingV) return;
  const rect = rightPane.getBoundingClientRect();
  const offsetY = e.clientY - rect.top;
  const minOut = 80;
  const maxOut = rect.height - 80;
  let h = offsetY;
  if (h < minOut) h = minOut;
  if (h > maxOut) h = maxOut;

  outputSection.style.flex = "none";
  outputSection.style.height = h + "px";
  inputSection.style.flex = "1";
});

window.addEventListener("resize", () => {
  if (editor) editor.layout();
});
