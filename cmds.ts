import { GoogleSpreadsheetCell } from "npm:google-spreadsheet";
import {
  Confirm,
  Input,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";
import { ansi } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/ansi.ts";

import {
  Config,
  configCredsPath,
  copyCredsFile,
  hasCredsFile,
  saveConfig,
} from "./config.ts";
import { resetAllConfig } from "./config.ts";
import { loadCellsForMonth, updateCell } from "./sheets.ts";
import type { DataCell, DataKey } from "./sheets.ts";

export type BaseCommandOptions = {
  sheetId: string;
  month: number;
};

export type StatusCommandOptions = BaseCommandOptions;

export type KeyedCommandOptions = BaseCommandOptions & {
  key: DataKey;
};

export async function runStatusCommand(opts: StatusCommandOptions) {
  console.log("👀 Loading your expenses...\n");
  const cells = await loadCellsForMonth(opts.sheetId, opts.month);
  console.log(ansi.cursorUp(2).cursorLeft.eraseLine());

  // TODO: refactor to use cliffy tables: https://cliffy.io/docs@v1.0.0-rc.3/table/options
  for (const cell of cells) {
    printCellStatus(cell);
  }
}

export async function runMarkCommand(opts: KeyedCommandOptions) {
  console.log(`Marking off ${opts.key} for the month...`);
  await updateCell(opts.sheetId, opts.month, opts.key, "✔");
  console.log("👍 Done");
}

export async function runClearCommand(opts: KeyedCommandOptions) {
  console.log(`Clearing ${opts.key} for the month...`);
  await updateCell(opts.sheetId, opts.month, opts.key, "");
  console.log("👍 Done");
}

export async function runSnoozeCommand(opts: KeyedCommandOptions) {
  console.log(`Snoozing ${opts.key} for the month...`);
  await updateCell(opts.sheetId, opts.month, opts.key, "X");
  console.log("👍 Done");
}

export async function runConfigResetCommand() {
  const confirmed = await Confirm.prompt({
    message: "Completely reset your local config?",
    default: false,
  });

  if (confirmed) {
    await resetAllConfig();
    console.log("\n🔥 Config reset.");
  } else {
    console.log("\n😴 Doing nothing.");
  }
}

export function runConfigListCommand(config: Config) {
  console.log(`sheetId=${config.sheetId}`);
  console.log(`credsFile=${configCredsPath()}`);
}

export async function runConfigCommand(config: Config) {
  const sheetId: string = await Input.prompt({
    message: `Enter data source Google Sheet ID`,
    default: config.sheetId,
    validate: (val) => !!val || "Sheet ID is a required config property.",
    transform: (val) => val.trim(),
  });
  await saveConfig({ ...config, sheetId });

  const hasCreds = await hasCredsFile();
  const configuredCredsPath = configCredsPath();

  const pathToCreds: string = await Input.prompt({
    message: `Path to service account credentials file`,
    default: hasCreds ? configuredCredsPath : undefined,
    transform: (val) => val.trim(),
  });
  if (pathToCreds !== configuredCredsPath) {
    await copyCredsFile(pathToCreds);
  }

  console.log("\n💾 Config updated.");
}

function printCellStatus(cell: DataCell) {
  console.log(`${cell.name}:`.padEnd(10), humanizeCellValue(cell.value));
}

function humanizeCellValue(cell: GoogleSpreadsheetCell): string {
  if (cell.value === null) return "❌";

  switch (cell.value.toString()) {
    case "✔":
      return "✅";
    case "X":
      return "😴";
    default:
      return `Unexpected value: "${cell.value}"`;
  }
}
