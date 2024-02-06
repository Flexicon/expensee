import { GoogleSpreadsheetCell } from "npm:google-spreadsheet";
import {
  Confirm,
  Input,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";

import { DataCell, getCellsForMonth, loadSheet } from "./sheets.ts";
import {
  Config,
  configCredsPath,
  copyCredsFile,
  hasCredsFile,
  saveConfig,
} from "./config.ts";
import { resetAllConfig } from "./config.ts";

export type StatusCommandOptions = {
  sheetId: string;
  month: number;
};

export async function runStatusCommand(opts: StatusCommandOptions) {
  const sheet = await loadSheet(opts.sheetId);
  const cells = getCellsForMonth(sheet, opts.month);

  for (const cell of cells) {
    printCellStatus(cell);
  }
}

export function runMarkCommand() {
  console.log("running mark command...");
}

export function runClearCommand() {
  console.log("running clear command...");
}

export function runSnoozeCommand() {
  console.log("running snooze command...");
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
