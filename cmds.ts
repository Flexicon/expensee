import { GoogleSpreadsheetCell } from "npm:google-spreadsheet";
import { Confirm, Input } from "@cliffy/prompt";
import { ansi } from "@cliffy/ansi";
import { colors } from "@cliffy/ansi/colors";
import { Table } from "@cliffy/table";

import { capitalize } from "./formatting.ts";
import {
  Config,
  configCredsPath,
  copyCredsFile,
  hasCredsFile,
  saveConfig,
} from "./config.ts";
import { resetAllConfig } from "./config.ts";
import { MONTHS } from "./consts.ts";
import { loadCellsForMonth, updateCell } from "./sheets.ts";
import type { DataKey } from "./sheets.ts";

export type BaseCommandOptions = {
  sheetId: string;
  month: number;
};

export type StatusCommandOptions = BaseCommandOptions;

export type KeyedCommandOptions = BaseCommandOptions & {
  keys: DataKey[];
};

export async function runStatusCommand(opts: StatusCommandOptions) {
  console.log("👀 Loading your expenses...\n");
  const cells = await loadCellsForMonth(opts.sheetId, opts.month);
  console.log(ansi.cursorUp(2).cursorLeft.eraseLine());
  const monthName = capitalize(MONTHS[opts.month - 1]);

  new Table()
    .header(["Expense", `Status (${monthName})`].map(colors.bold))
    .body(cells.map((c) => [c.name, humanizeCellValue(c.value)]))
    .minColWidth(12)
    .render();
}

export async function runMarkCommand(opts: KeyedCommandOptions) {
  const monthName = capitalize(MONTHS[opts.month - 1]);
  console.log(`Marking off ${opts.keys.join(", ")} for ${monthName}...`);
  for (const key of opts.keys) {
    await updateCell(opts.sheetId, opts.month, key, "✔");
  }
  console.log("👍 Done");
}

export async function runClearCommand(opts: KeyedCommandOptions) {
  const monthName = capitalize(MONTHS[opts.month - 1]);
  console.log(`Clearing ${opts.keys.join(", ")} for ${monthName}...`);
  for (const key of opts.keys) {
    await updateCell(opts.sheetId, opts.month, key, "");
  }
  console.log("👍 Done");
}

export async function runSnoozeCommand(opts: KeyedCommandOptions) {
  const monthName = capitalize(MONTHS[opts.month - 1]);
  console.log(`Snoozing ${opts.keys.join(", ")} for ${monthName}...`);
  for (const key of opts.keys) {
    await updateCell(opts.sheetId, opts.month, key, "X");
  }
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
