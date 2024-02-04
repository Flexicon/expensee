import { GoogleSpreadsheetCell } from "npm:google-spreadsheet";
import { DataCell, getCellsForMonth, loadSheet } from "./sheets.ts";

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

export async function runMarkCommand() {
  console.log("running mark command...");
}

export async function runClearCommand() {
  console.log("running clear command...");
}

export async function runSnoozeCommand() {
  console.log("running snooze command...");
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
