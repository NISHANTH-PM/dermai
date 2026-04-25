#!/usr/bin/env node

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.resolve(__dirname, "../../Output");

const FILES = [
  {
    name: "model_ham10000.onnx",
    id: "1tIlrq8zqYS8NDNRxEg27gYc9bat4nwgz",
  },
  {
    name: "label_map.json",
    id: "1Ok86Nt21J2Fcf6rhEkZ-CiGp11VSQFk8",
  },
  {
    name: "model_metadata.json",
    id: "1xtweU4BQqa52JZE7FS3iOCGGnUjgiTgd",
  },
  {
    name: "preprocess_config.json",
    id: "1-Sh5oJ7EbxWED2fNlP8xH9zdd-Rw2-P-",
  },
];

function downloadFile(fileId, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      const size = fs.statSync(destPath).size;
      if (size > 1000) {
        console.log(`  ✓ Already exists: ${path.basename(destPath)} (${(size/1024/1024).toFixed(1)}MB)`);
        return resolve();
      }
      // File exists but too small — delete and re-download
      fs.unlinkSync(destPath);
    }

    console.log(`  ↓ Downloading: ${path.basename(destPath)}...`);

    // Use the export download URL with confirmation bypass
    const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&authuser=0`;

    const file = fs.createWriteStream(destPath);
    let totalBytes = 0;

    function makeRequest(requestUrl, redirectCount) {
      if (redirectCount > 15) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error("Too many redirects"));
      }

      const client = requestUrl.startsWith("https") ? https : http;

      const options = {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      };

      client.get(requestUrl, options, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303 || response.statusCode === 307) {
          makeRequest(response.headers.location, redirectCount + 1);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error(`HTTP ${response.statusCode} for ${path.basename(destPath)}`));
        }

        response.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes % (5 * 1024 * 1024) < chunk.length) {
            process.stdout.write(`\r  ↓ ${path.basename(destPath)}: ${(totalBytes/1024/1024).toFixed(1)}MB downloaded...`);
          }
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`\n  ✅ Done: ${path.basename(destPath)} (${(totalBytes/1024/1024).toFixed(1)}MB)`);
          resolve();
        });

        file.on("error", (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    makeRequest(url, 0);
  });
}

async function main() {
  console.log("\n📦 Checking model files...");
  console.log(`  Output directory: ${OUTPUT_DIR}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`  Created directory: ${OUTPUT_DIR}`);
  }

  for (const file of FILES) {
    const destPath = path.join(OUTPUT_DIR, file.name);
    try {
      await downloadFile(file.id, destPath);
    } catch (err) {
      console.error(`\n  ❌ Failed to download ${file.name}:`, err.message);
      process.exit(1);
    }
  }

  console.log("\n✅ All model files ready!\n");
}

main();