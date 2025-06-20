# ratpi-cli CLI

ratpi-cli is a multi-purpose CLI tool for project management.

## Version

`1.0.1`

# ratpi-cli

ratpi-cli is a multi-purpose CLI tool for project management.

**Options**

- `-v, --version` : Display the current version of ratpi-cli

**Sous-commandes**

- [create-script](#create-script) : Create a script template using Commander and Chalk
- [workflow](#workflow) : Manage GitHub workflows


## create-script

Create a script template using Commander and Chalk

**Options**

- `--template <name>` : Template name
- `--use <path>` : Path to JSON config file
- `--skip-devDependencies` : Skip installation of dev dependencies
- `--output <dir>` : Output directory for generated project
- `--sample-conf` : Copy sample config (basic.json) to ./ratpi-cli.config.json


## workflow

Manage GitHub workflows

**Sous-commandes**

- [list](#list) : List available workflows from .github/workflows
- [create](#create) : Create a workflow from a template in .github/workflows


### list

List available workflows from .github/workflows


### create

Create a workflow from a template in .github/workflows

**Options**

- `--template <name>` : Template name to copy from .github/workflows

