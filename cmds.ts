import { colors } from "@cliffy/ansi/colors";
import { tty } from "@cliffy/ansi/tty";
import { Checkbox, Confirm, Input } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import type { GoogleSpreadsheetCell } from "google-spreadsheet";

import {
  type Config,
  configCredsPath,
  copyCredsFile,
  hasCredsFile,
  resetAllConfig,
  saveConfig,
} from "./config.ts";
import { MONTHS } from "./consts.ts";
import { capitalize } from "./formatting.ts";
import { DataKey, loadCellsForMonth, updateCell } from "./sheets.ts";

export type BaseCommandOptions = {
  sheetId: string;
  month: number;
};

export type StatusCommandOptions = BaseCommandOptions;

export type KeyedCommandOptions = BaseCommandOptions & {
  keys: DataKey[];
};

export async function runStatusCommand(opts: StatusCommandOptions) {
  console.log("👀 Loading your expenses...");
  const cells = await loadCellsForMonth(opts.sheetId, opts.month);
  const rows = cells.map((c) => [c.name, humanizeCellValue(c.value)]);
  const monthName = capitalize(MONTHS[opts.month - 1]);

  tty.cursorUp.cursorLeft.eraseLine();

  new Table(...rows)
    .header(["Expense", `Status (${monthName})`].map(colors.bold))
    .minColWidth(12)
    .render();
}

export async function runMarkCommand(opts: KeyedCommandOptions) {
  const keys = await resolveKeys(
    opts.keys,
    "Which expenses do you want to mark as done?",
  );
  if (keys.length === 0) return;

  const monthName = capitalize(MONTHS[opts.month - 1]);
  console.log(`Marking off ${keys.join(", ")} for ${monthName}...`);

  for (const key of keys) {
    await updateCell(opts.sheetId, opts.month, key, "✔");
  }
  console.log("👍 Done");
}

export async function runClearCommand(opts: KeyedCommandOptions) {
  const keys = await resolveKeys(
    opts.keys,
    "Which expenses do you want to clear?",
  );
  if (keys.length === 0) return;

  const monthName = capitalize(MONTHS[opts.month - 1]);
  console.log(`Clearing ${keys.join(", ")} for ${monthName}...`);

  for (const key of keys) {
    await updateCell(opts.sheetId, opts.month, key, "");
  }
  console.log("👍 Done");
}

export async function runSnoozeCommand(opts: KeyedCommandOptions) {
  const keys = await resolveKeys(
    opts.keys,
    "Which expenses do you want to snooze?",
  );
  if (keys.length === 0) return;

  const monthName = capitalize(MONTHS[opts.month - 1]);
  console.log(`Snoozing ${keys.join(", ")} for ${monthName}...`);

  for (const key of keys) {
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

async function resolveKeys(
  keys: DataKey[],
  prompt: string,
): Promise<DataKey[]> {
  if (keys.length > 0) return keys;

  return await Checkbox.prompt({
    message: prompt,
    confirmSubmit: false,
    minOptions: 1,
    uncheck: "☐",
    options: Object.values(DataKey).map((key) => ({
      name: capitalize(key),
      value: key,
    })),
  }) as DataKey[];
}
