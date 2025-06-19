# Ratpi CLI

`ratpi-cli` is a utility for quickly generating script templates using [Commander](https://github.com/tj/commander.js/) and [Chalk](https://github.com/chalk/chalk).

## Installation

You can run it directly with `npx`:

```bash
npx ratpi-cli create-script:init
```

## Usage

```
ratpi-cli create-script:init [options]
```

Options:

- `--template <name>` – use one of the built‑in templates located in `templates/`.
- `--use <path>` – path to a JSON configuration file describing the commands.
- `--no-install-deps` – skip installing `commander` and `chalk` as devDependencies in the current project.

A configuration file should look like:

```json
{
  "name": "my-script",
  "commands": [
    { "name": "hello", "description": "Print hello" }
  ]
}
```

This will create a new folder `my-script` containing an executable `index.js` using Commander and Chalk.

## Development

```bash
npm install
npm run build
```

## Publishing

This project is configured to build on `npm prepare` so publishing to npm is straightforward:

```bash
npm publish
```

## Continuous Integration

A simple GitHub Actions workflow is provided in `.github/workflows/ci.yml` to run the build.
