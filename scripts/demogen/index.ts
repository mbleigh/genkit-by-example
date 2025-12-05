/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { vertexAI } from "@genkit-ai/google-genai";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { genkit } from "genkit";
import { join } from "path";

const GENKIT_HOME = process.env.GENKIT_HOME || "../genkit";

const ai = genkit({
  model: vertexAI.model("gemini-2.5-flash"),
  plugins: [
    vertexAI({ projectId: "bleigh-genkit-test", location: "us-central1" }),
  ],
  promptDir: "scripts/demogen/prompts",
});

interface Demo {
  metadata?: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    complexity: number;
  };
  readme?: string;
  plan?: string;
  files?: { ext: string; path: string; content: string }[];
  docs?: { name: string; content: string }[];
}

function save(demo: Demo) {
  writeFileSync(
    "scripts/demogen/" + demo.metadata!.id + ".json",
    JSON.stringify(demo, null, 2),
    { encoding: "utf8" }
  );
}

function extractFirstCodeBlock(llmResponse: string): string | null {
  const codeBlockRegex = /```([a-zA-Z0-9+#-]+)?(?:\{.*?\})?\n([\s\S]*?)\n```/; // Added metadata handling
  const match = llmResponse.match(codeBlockRegex);

  if (match) {
    const code = match[2];
    return code.trim();
  }

  return null;
}

let headingCount = 0;
function heading(step: string) {
  console.log();
  console.log(++headingCount, "-- Generating", step);
  console.log();
}

async function main(prompt: string, docfiles: string[]) {
  const docs = docfiles.map((f) => {
    return {
      name: f,
      content: readFileSync(join(GENKIT_HOME, "docs", f + ".md"), {
        encoding: "utf8",
      }),
    };
  });

  const demo: Demo = {};

  heading("metadata");
  demo.metadata = (
    await ai.prompt("01_metadata")({ prompt, docs, demo })
  ).output;
  console.dir(demo.metadata, { depth: null });
  save(demo);

  heading("plan");
  demo.plan = (await ai.prompt("02_plan")({ prompt, docs, demo })).text;
  console.log(demo.plan);
  save(demo);

  heading("readme");
  const readmeOut = (await ai.prompt("03_readme")({ prompt, docs, demo })).text;
  demo.readme = extractFirstCodeBlock(readmeOut) || readmeOut;
  console.log(demo.readme);
  save(demo);

  heading("route.ts");
  demo.files = [];
  demo.files.push({
    ext: "ts",
    path: "api/route.ts",
    content:
      extractFirstCodeBlock(
        (await ai.prompt("04_route")({ prompt, docs, demo })).text
      ) || "",
  });
  console.log(demo.files.at(-1)?.content);
  save(demo);

  heading("config.tsx");
  demo.files.push({
    ext: "tsx",
    path: "config.tsx",
    content:
      extractFirstCodeBlock(
        (await ai.prompt("05_config")({ prompt, docs, demo })).text
      ) || "",
  });
  console.log(demo.files.at(-1)?.content);
  save(demo);

  heading("app.tsx");
  demo.files.push({
    ext: "tsx",
    path: "app.tsx",
    content:
      extractFirstCodeBlock(
        (await ai.prompt("06_app")({ prompt, docs, demo })).text
      ) || "",
  });
  console.log(demo.files.at(-1)?.content);
  save(demo);

  heading("page.tsx");
  demo.files.push({
    ext: "ts",
    path: "page.tsx",
    content:
      extractFirstCodeBlock(
        (await ai.prompt("07_page")({ prompt, docs, demo })).text
      ) || "",
  });
  console.log(demo.files.at(-1)?.content);
  save(demo);

  heading("ALL GENERATION COMPLETE, WRITING TO FILES");

  const DEMO_ROOT = `src/app/${demo.metadata!.id}`;
  if (!existsSync(DEMO_ROOT))
    mkdirSync(join(DEMO_ROOT, "/api"), { recursive: true });
  console.log("- writing files into", DEMO_ROOT);
  writeFileSync(join(DEMO_ROOT, "README.md"), demo.readme, {
    encoding: "utf8",
  });
  console.log("- wrote README.md");
  for (const file of demo.files) {
    writeFileSync(join(DEMO_ROOT, file.path), file.content, {
      encoding: "utf8",
    });
    console.log("-", "wrote", file.path);
  }
}

const prompt = process.argv[2];
const docfiles = process.argv.slice(3);

main(prompt, ["index", ...docfiles]);
