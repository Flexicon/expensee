import {
  GoogleSpreadsheet,
  GoogleSpreadsheetCell,
  GoogleSpreadsheetWorksheet,
} from "npm:google-spreadsheet";
import { JWT } from "npm:google-auth-library";

import creds from "./g-creds.json" with { type: "json" };

const DATA_START_ROW = 22;
const DATA_CELL_RANGE = "A23:M26";

const DATA_LABELS = ["Apartment", "Mortgage", "Electric", "Internet"];

export interface DataCell {
  name: string;
  value: GoogleSpreadsheetCell;
}

export async function loadSheet(
  sheetId: string,
): Promise<GoogleSpreadsheetWorksheet> {
  const jwt = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  const doc = new GoogleSpreadsheet(sheetId, jwt);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  await sheet.loadCells(DATA_CELL_RANGE);

  return sheet;
}

export function getCellsForMonth(
  sheet: GoogleSpreadsheetWorksheet,
  month: number,
): DataCell[] {
  return [...Array(4).keys()].map((i) => ({
    name: DATA_LABELS[i],
    value: sheet.getCell(DATA_START_ROW + i, month),
  }));
}
