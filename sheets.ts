import {
  GoogleSpreadsheet,
  GoogleSpreadsheetCell,
  GoogleSpreadsheetWorksheet,
} from "npm:google-spreadsheet";
import { JWT } from "npm:google-auth-library";

import { loadCredsFile } from "./config.ts";

const capitalize = (val: string) => val.charAt(0).toUpperCase() + val.slice(1);

export enum DataKey {
  Apartment = "apartment",
  Mortgage = "mortgage",
  Electric = "electric",
  Internet = "internet",
  Hetzner = "hetzner",
  Taxes = "taxes",
}

const DATA_LABELS = [
  capitalize(DataKey.Apartment),
  capitalize(DataKey.Mortgage),
  capitalize(DataKey.Electric),
  capitalize(DataKey.Internet),
  capitalize(DataKey.Hetzner),
  capitalize(DataKey.Taxes),
];

const DATA_START_ROW = 22;
const DATA_CELL_RANGE = `A23:M${DATA_START_ROW + DATA_LABELS.length}`;

export interface DataCell {
  name: string;
  value: GoogleSpreadsheetCell;
}

export async function loadCellsForMonth(
  sheetId: string,
  month: number,
): Promise<DataCell[]> {
  const sheet = await loadSheet(sheetId);
  return getCellsForMonth(sheet, month);
}

export async function updateCell(
  sheetId: string,
  month: number,
  key: DataKey,
  value: string,
) {
  const sheet = await loadSheet(sheetId);

  const keyIdx = DATA_LABELS.indexOf(capitalize(key));
  sheet.getCell(DATA_START_ROW + keyIdx, month).value = value;

  await sheet.saveUpdatedCells();
}

async function loadSheet(
  sheetId: string,
): Promise<GoogleSpreadsheetWorksheet> {
  const creds = await loadCredsFile();
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

function getCellsForMonth(
  sheet: GoogleSpreadsheetWorksheet,
  month: number,
): DataCell[] {
  return DATA_LABELS.map((name, i) => ({
    name,
    value: sheet.getCell(DATA_START_ROW + i, month),
  }));
}
