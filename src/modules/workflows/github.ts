import https from "https";

const GITHUB_WORKFLOWS_URL =
    "https://api.github.com/repos/ratpi-studio/ratpi-cli/contents/.github/workflows?ref=master";

export async function fetchWorkflowsList(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    https.get(
      GITHUB_WORKFLOWS_URL,
      {
        headers: { "User-Agent": "ratpi-cli" },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const files = JSON.parse(data) as { name: string }[];
            if (Array.isArray(files)) {
              resolve(
                files
                  .filter((f) => f.name.endsWith(".yml") || f.name.endsWith(".yaml"))
                  .map((f) => f.name),
              );
            } else {
              resolve([]);
            }
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        });
      },
    ).on("error", reject);
  });
}

export async function downloadWorkflowFile(templateName: string): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const url = `https://raw.githubusercontent.com/ratpi-studio/ratpi-cli/master/.github/workflows/${templateName}`;
    https.get(
      url,
      {
        headers: { "User-Agent": "ratpi-cli" },
      },
      (res) => {
        if (res.statusCode !== 200) return resolve(null);
        const data: Buffer[] = [];
        res.on("data", (chunk: Buffer) => data.push(chunk));
        res.on("end", () => resolve(Buffer.concat(data)));
      },
    ).on("error", reject);
  });
}
