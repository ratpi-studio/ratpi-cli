import fs from "fs";
import https from "https";
import path from "path";
import chalk from "chalk";

const API_KEY = process.env.GDRIVE_API_KEY;
const DRIVE_API = "www.googleapis.com";

function requireKey(): string | null {
  if (!API_KEY) {
    console.error(chalk.red("GDRIVE_API_KEY is not set"));
    return null;
  }
  return API_KEY;
}

export async function listFiles(): Promise<void> {
  if (!requireKey()) return;
  const options = {
    hostname: DRIVE_API,
    path: `/drive/v3/files?key=${API_KEY}`,
    method: "GET",
    headers: { "User-Agent": "ratpi-cli" },
  };
  const data = await httpRequest(options);
  const res = JSON.parse(data);
  if (Array.isArray(res.files)) {
    res.files.forEach((f: { id: string; name: string }) => {
      console.log(`${f.id}\t${f.name}`);
    });
  } else {
    console.log(chalk.yellow("No files found"));
  }
}

export async function uploadFile(file: string): Promise<string | null> {
  if (!requireKey()) return null;
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(chalk.red(`File not found: ${filePath}`));
    return null;
  }
  const stats = fs.statSync(filePath);
  const boundary = "----ratpi-cli" + Date.now();
  const metadata = JSON.stringify({ name: path.basename(filePath) });
  const payload =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    metadata +
    `\r\n--${boundary}\r\n` +
    "Content-Type: application/octet-stream\r\n\r\n";
  const fileBuffer = fs.readFileSync(filePath);
  const end = `\r\n--${boundary}--`;
  const options = {
    hostname: DRIVE_API,
    path: `/upload/drive/v3/files?uploadType=multipart&key=${API_KEY}`,
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": Buffer.byteLength(payload) + stats.size + Buffer.byteLength(end),
      "User-Agent": "ratpi-cli",
    },
  };
  const data = await httpRequest(options, Buffer.concat([Buffer.from(payload), fileBuffer, Buffer.from(end)]));
  const res = JSON.parse(data);
  if (res.id) {
    console.log(chalk.green(`Uploaded ${file} with ID ${res.id}`));
    return res.id as string;
  }
  console.error(chalk.red("Upload failed"));
  return null;
}

export async function getFileLink(fileId: string): Promise<void> {
  if (!requireKey()) return;
  const options = {
    hostname: DRIVE_API,
    path: `/drive/v3/files/${fileId}?fields=webViewLink&key=${API_KEY}`,
    method: "GET",
    headers: { "User-Agent": "ratpi-cli" },
  };
  const data = await httpRequest(options);
  const res = JSON.parse(data);
  if (res.webViewLink) {
    console.log(res.webViewLink);
  } else {
    console.log(chalk.red("Could not retrieve link"));
  }
}

function httpRequest(options: https.RequestOptions, data?: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(body));
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}
