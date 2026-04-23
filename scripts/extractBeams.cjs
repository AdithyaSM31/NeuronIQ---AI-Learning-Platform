const fs = require('fs');

const content = fs.readFileSync('C:/Users/adith/.gemini/antigravity/brain/e4a9a23a-49ee-4d74-8d4f-911767d32406/.system_generated/steps/634/content.md', 'utf-8');
const jsonPart = content.split('---')[1].trim();
const data = JSON.parse(jsonPart);

let fileContent = data.files[0].content;

// 1. Remove "use client"
fileContent = fileContent.replace('"use client";\n', '');

// 2. Change import { motion } from "motion/react" -> "framer-motion"
fileContent = fileContent.replace(/motion\/react/g, 'framer-motion');

// 3. Remove cn and tailwind dependencies
fileContent = fileContent.replace('import { cn } from "@/lib/utils";\n', '');
fileContent = fileContent.replace(/className=\{cn\([\s\S]*?className,[\s\S]*?\)\}/, 'className={`background-beams ${className || ""}`}');

// 4. Inject vanilla CSS instead of tailwind for the container and svg
fileContent = fileContent.replace('className={`background-beams ${className || ""}`}', `className={\`background-beams \${className || ""}\`} style={{ position: "absolute", inset: 0, display: "flex", height: "100%", width: "100%", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0, maskRepeat: "no-repeat", maskSize: "40px", WebkitMaskRepeat: "no-repeat", WebkitMaskSize: "40px" }}`);
fileContent = fileContent.replace('className="pointer-events-none absolute z-0 h-full w-full"', 'style={{ pointerEvents: "none", position: "absolute", zIndex: 0, height: "100%", width: "100%" }}');

fs.writeFileSync('src/components/BackgroundBeams.jsx', fileContent);
console.log('Successfully created BackgroundBeams.jsx');
