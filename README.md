<p align="center">
  <img src="https://raw.githubusercontent.com/ratpi-studio/ratpi-cli/refs/heads/master/static/assets/logo.png" alt="Ratpi CLI Logo" width="65" height="65" />
</p>

# Ratpi CLI

[![CI](https://github.com/ratpi-studio/ratpi-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/ratpi-studio/ratpi-cli/actions/workflows/ci.yml)
[![Release](https://github.com/ratpi-studio/ratpi-cli/actions/workflows/release.yml/badge.svg)](https://github.com/ratpi-studio/ratpi-cli/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

`ratpi-cli` is a utility for quickly generating script templates using [Commander](https://github.com/tj/commander.js/) and [Chalk](https://github.com/chalk/chalk).

---

## 🚀 Installation

You can run it directly with `npx`:

```bash
npx ratpi-cli create-script:init
```

## 🛠 Usage

```
ratpi-cli create-script:init [options]
```

Options:

- `--template <name>` – use one of the built-in templates located in `templates/`.
- `--use <path>` – path to a JSON configuration file describing the commands.
- `--no-install-deps` – skip installing `commander` and `chalk` as devDependencies in the current project.
- `--output <dir>` – directory where the project will be generated. If not provided you will be prompted.

A configuration file should look like:

```json
{
  "name": "supercli",
  "description": "An all-in-one CLI tool to automate your tasks.",
  "version": "1.0.0",
  "args": [
    {
      "name": "name",
      "small": "n",
      "type": "string",
      "required": false,
      "description": "Name of the person to greet",
      "example": "Alex",
      "interactive": true
    }
  ]
}
```

This will create a new folder `my-script` containing an executable `index.js` using Commander and Chalk.

## 🤖 AI Agent (Gemini Flash 2.0)

Ratpi CLI includes an AI agent powered by Gemini Flash 2.0, designed to assist users with technical tasks, workflow automation, and answering questions. The agent follows a supervised task completion protocol to ensure quality and relevance of its responses.

### Key Features

- **Project context awareness**: The agent can analyze the current environment (git repo, dependencies, scripts, etc.).
- **Tool usage**: Access to tools for reading/writing files, running shell commands, listing files, and more.
- **Structured interaction**: The agent never asks free-form questions; it uses a dedicated tool to request clarifications from the user.
- **Automatic supervision**: Each task is optimized, verified, and corrected if needed by an AI supervisor before final validation.
- **Error handling**: The agent clearly informs the user in case of errors or if an action cannot be completed.

### Usage

Set the `GEMINI_API_KEY` environment variable, then run:

```bash
ratpi-cli agent "<your goal>"
```

Example:

```bash
ratpi-cli agent "Generate a Node.js script that reads a JSON file and prints its content."
```

The agent will:

1. Optimize your instruction.
2. Execute the task using available tools.
3. Present a summary and wait for your confirmation.
4. Finalize or correct based on your feedback.

### Available tools for the agent

- Read/write files
- Run shell commands
- List files/folders
- Retrieve project context
- Request user input

### Task completion protocol

1. **Analysis and actions**: The agent presents a summary of its actions.
2. **Awaiting confirmation**: You validate or request a correction.
3. **Finalization**: The agent completes the task or continues as needed.

For more details, see the `src/modules/agent/` folder.

---

## 🧑‍💻 Development

```bash
bun install
bun run build
```

## 🌐 More info

Visit [ratpi-studio.fr](https://ratpi-studio.fr) for more tools and documentation.
