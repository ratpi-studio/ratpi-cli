import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import * as os from "os";
import * as path from "path";

type GitContext = {
    isRepo: boolean;
    branch?: string;
    status?: string;
    lastCommit?: string;
};

type ProjectContext = {
    cwd: string;
    projectName?: string;
    user: string;
    platform: string;
    nodeVersion: string;
    git: GitContext;
    packageManager?: string;
    scripts?: string[];
    hasTsConfig: boolean;
    mainDependencies?: string[];
    env: Record<string, string>;
    date: string;
};

export async function getContext(): Promise<ProjectContext> {
    const cwd = process.cwd();
    let projectName: string | undefined;
    let mainDependencies: string[] | undefined;
    let scripts: string[] | undefined;
    let packageManager: string | undefined;

    const packageJsonPath = path.join(cwd, "package.json");
    if (existsSync(packageJsonPath)) {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        projectName = pkg.name;
        mainDependencies = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
        if (pkg.devDependencies) {
            mainDependencies = [...mainDependencies, ...Object.keys(pkg.devDependencies)];
        }
        if (pkg.scripts) {
            scripts = Object.keys(pkg.scripts);
        }
        if (existsSync(path.join(cwd, "yarn.lock"))) packageManager = "yarn";
        else if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) packageManager = "pnpm";
        else if (existsSync(path.join(cwd, "bun.lockb"))) packageManager = "bun";
        else if (existsSync(path.join(cwd, "package-lock.json"))) packageManager = "npm";
    }

    const hasTsConfig = existsSync(path.join(cwd, "tsconfig.json"));

    let git: GitContext = { isRepo: false };
    try {
        execSync("git rev-parse --is-inside-work-tree", { cwd, stdio: "ignore" });
        git.isRepo = true;
        git.branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd }).toString().trim();
        git.status = execSync("git status --short", { cwd }).toString().trim() || "clean";
        git.lastCommit = execSync("git log -1 --pretty=format:%s", { cwd }).toString().trim();
    } catch { }

    const user = os.userInfo().username;
    const platform = process.platform;
    const nodeVersion = process.version;

    const env = {
        NODE_ENV: process.env.NODE_ENV || "development",
        ...Object.fromEntries(Object.entries(process.env).filter(([k]) =>
            ["NODE_ENV", "CI", "REACT_APP_BUILD_TARGET", "CUSTOM_API_URL"].includes(k)
        ))
    };
    const date = new Date().toISOString();

    return {
        cwd,
        projectName,
        user,
        platform,
        nodeVersion,
        git,
        packageManager,
        scripts,
        hasTsConfig,
        mainDependencies,
        env,
        date
    };
}
