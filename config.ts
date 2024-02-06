import { ValidationError } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";

export interface Config {
  sheetId?: string;
}

export interface Creds {
  client_email: string;
  private_key: string;
}

export const configDir = (): string =>
  `${Deno.env.get("HOME")}/.config/expensee`;
export const configPath = (): string => `${configDir()}/config.json`;
export const configCredsPath = (): string => `${configDir()}/creds.json`;

export async function initConfigIfNeeded() {
  await Deno.mkdir(configDir(), {
    recursive: true,
  });

  try {
    await Deno.stat(configPath());
  } catch {
    await saveConfig({});
  }
}

export async function loadConfig(): Promise<Config> {
  await initConfigIfNeeded();
  return JSON.parse(await Deno.readTextFile(configPath()));
}

export async function saveConfig(config: Config) {
  await Deno.writeTextFile(configPath(), JSON.stringify(config, undefined, 2));
}

export async function hasCredsFile() {
  try {
    await Deno.stat(configCredsPath());
    return true;
  } catch {
    return false;
  }
}

export async function copyCredsFile(path: string) {
  await Deno.copyFile(path, configCredsPath());
}

export async function loadCredsFile(): Promise<Creds> {
  if (!(await hasCredsFile())) {
    throw new ValidationError(
      "No credentials file configured. Please run config command.",
    );
  }
  return JSON.parse(await Deno.readTextFile(configCredsPath()));
}

export async function resetAllConfig() {
  await Deno.remove(configDir(), { recursive: true });
}
