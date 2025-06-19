export interface Arg {
  name: string;
  small?: string;
  type: "string" | "number" | "boolean" | "enum";
  required: boolean;
  description: string;
  example?: string | number;
  interactive: boolean;
  values?: string[];
}

export interface RatpiCLIConfig {
  name: string;
  description: string;
  version: string;
  args: Arg[];
}

export interface Options {
  template?: string;
  use?: string;
  installDeps?: boolean;
  output?: string;
  skipDevDependencies?: boolean;
}
