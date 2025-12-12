import { google } from 'googleapis';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const KEY_FILE = path.join(process.cwd(), 'bloom-budget-09d2ea03c17b.json');

export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export async function readSheet(spreadsheetId: string, range: string) {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values;
}

export async function writeSheet(spreadsheetId: string, range: string, values: any[][]) {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
  return response.data;
}
