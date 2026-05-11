const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

function authHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!sheetsKey) throw new Error("GOOGLE_SHEETS_API_KEY is not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
    "Content-Type": "application/json",
  };
}

function sheetId() {
  const id = process.env.CLINIC_SHEET_ID;
  if (!id) throw new Error("CLINIC_SHEET_ID is not configured");
  return id;
}

export async function getValues(range: string): Promise<string[][]> {
  const url = `${GATEWAY_URL}/spreadsheets/${sheetId()}/values/${range}`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Sheets getValues failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return (data.values as string[][]) ?? [];
}

export async function appendRow(range: string, row: (string | number)[]): Promise<void> {
  const url = `${GATEWAY_URL}/spreadsheets/${sheetId()}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ values: [row] }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Sheets append failed [${res.status}]: ${JSON.stringify(data)}`);
  }
}