# Ratpi CLI

`ratpi-cli` is a utility for quickly generating script templates using [Commander](https://github.com/tj/commander.js/) and [Chalk](https://github.com/chalk/chalk).

## Installation

You can run it directly with `bunx`:

```bash
bunx ratpi-cli create-script:init
```

## Usage

```
ratpi-cli create-script:init [options]
```

Options:

- `--template <name>` – use one of the built‑in templates located in `templates/`.
- `--use <path>` – path to a JSON configuration file describing the commands.
- `--no-install-deps` – skip installing `commander` and `chalk` as devDependencies in the current project.
- `--output <dir>` – directory where the project will be generated. If not provided you will be prompted.

A configuration file should look like:

```json
{
  "name": "supercli",
  "description": "Un outil CLI tout-en-un pour automatiser vos tâches.",
  "version": "1.0.0",
  "args": [
    {
      "name": "name",
      "small": "n",
      "type": "string",
      "required": false,
      "description": "Nom de la personne à saluer",
      "example": "Alex",
      "interactive": true
    }
  ]
}
```

This will create a new folder `my-script` containing an executable `index.js` using Commander and Chalk.

## Development

```bash
bun install
bun run build
```

## Publishing

This project is configured to build on `npm prepare` so publishing to npm is straightforward:

```bash
npm publish
```

## Continuous Integration

A simple GitHub Actions workflow is provided in `.github/workflows/ci.yml` to run the build.
