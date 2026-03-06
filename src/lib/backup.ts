import { google } from "googleapis";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

const DB_URL = process.env.DATABASE_URL;
const GD_FOLDER_ID = process.env.BACKUP_FOLDER_ID;
const SA_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!DB_URL || !GD_FOLDER_ID || !SA_CREDENTIALS) {
  console.error("Missing required environment variables.");
  console.error(DB_URL, GD_FOLDER_ID, SA_CREDENTIALS);
  process.exit(1);
}

// Convert service account JSON string to an object
const credentials = JSON.parse(SA_CREDENTIALS);

async function uploadFile(filePath: string, folderId: string) {
  const auth = new google.auth.JWT();

  auth.fromJSON(credentials);
  auth.scopes = ["https://www.googleapis.com/auth/drive.file"];

  const drive = google.drive({ version: "v3", auth });
  const fileName = path.basename(filePath);

  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        body: fs.createReadStream(filePath),
      },
      fields: "id",
      supportsAllDrives: true,
    });
    console.log("File uploaded, File ID:", response.data.id);
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
  }
}

function dumpDatabase(
  callback: (err: Error | null, filePath: string | null) => void,
) {
  const fileName = `backup_${new Date().toISOString()}.sql`;
  const filePath = path.join(process.cwd(), fileName);

  // Use pg_dump command with the DATABASE_URL environment variable
  const command = `pg_dump ${DB_URL} > ${filePath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return callback(error, null);
    }
    console.log(`Database dump created at ${filePath}`);
    callback(null, filePath);
  });
}

// Main execution
dumpDatabase((err, filePath) => {
  if (err || !filePath) return;
  uploadFile(filePath, GD_FOLDER_ID).finally(() => {
    // Clean up the local backup file
    fs.unlinkSync(filePath);
    console.log(`Cleaned up local file ${filePath}`);
  });
});
