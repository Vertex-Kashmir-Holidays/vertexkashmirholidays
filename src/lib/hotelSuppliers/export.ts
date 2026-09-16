// Excel export for the Hotel Rates module — one sheet per destination among
// the selected hotels (tab name = destination), each sheet holding one block
// per hotel (Name/Phone/Email/Map/Valid, then a Room Type/CP/MAP rate
// table) — the exact rate-sheet layout Sales shares externally. Pure,
// client-safe — operates on already-loaded hotel records.
//
// Uses exceljs rather than the `xlsx` package elsewhere in this module: the
// `xlsx` package's community edition silently drops cell styling (font/fill/
// border) on write, which this export needs for bold, colored header rows
// and a real table grid.
import ExcelJS from "exceljs";
import { HOTEL_DESTINATIONS, type HotelRate } from "./schema";

export interface HotelExportInput {
  hotelName: string;
  destination: string;
  phone: string | null;
  email: string | null;
  mapUrl: string | null;
  rate: HotelRate | null;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFBFBFBF" } },
  left: { style: "thin", color: { argb: "FFBFBFBF" } },
  bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
  right: { style: "thin", color: { argb: "FFBFBFBF" } },
};

// Light green, matching the accent color already used for "light" surfaces
// elsewhere in the Hotel Rates module (e.g. the PDF's lightGreen chip fill).
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8F2EB" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  });
}

function styleDataRow(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: false }, (cell) => {
    cell.border = THIN_BORDER;
  });
}

function addHotelBlock(ws: ExcelJS.Worksheet, h: HotelExportInput) {
  styleHeaderRow(ws.addRow(["Name", "Phone", "Email", "Map", "Valid"]));
  styleDataRow(ws.addRow([h.hotelName, h.phone ?? "", h.email ?? "", h.mapUrl ?? "", fmtDate(h.rate?.validTo)]));

  ws.addRow(["Room Rates"]).getCell(1).font = { bold: true };
  styleHeaderRow(ws.addRow(["Room Type", "CP", "MAP"]));
  for (const r of h.rate?.rooms ?? []) {
    styleDataRow(ws.addRow([r.roomType, r.cp ?? "", r.map ?? ""]));
  }

  ws.addRow([]); // blank separator row before the next hotel's block
}

// Excel sheet names can't contain : \ / ? * [ ] and are capped at 31 chars —
// a few destinations (e.g. "Gulmarg / Tangmarg") contain "/".
function sheetName(destination: string): string {
  return destination.replace(/[:\\/?*[\]]/g, "-").slice(0, 31);
}

export function buildHotelExportWorkbook(hotels: HotelExportInput[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  for (const destination of HOTEL_DESTINATIONS) {
    const group = hotels.filter((h) => h.destination === destination);
    if (group.length === 0) continue;
    const ws = wb.addWorksheet(sheetName(destination));
    ws.columns = [{ width: 26 }, { width: 16 }, { width: 26 }, { width: 22 }, { width: 14 }];
    for (const h of group) addHotelBlock(ws, h);
  }
  return wb;
}
