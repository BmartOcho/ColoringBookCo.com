import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Database file path (in project root)
const DB_PATH = path.join(process.cwd(), 'coloring_book.db');

// Initialize database connection
let db: Database.Database | null = null;

function getDb(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        initializeTables();
    }
    return db;
}

// Create tables if they don't exist
function initializeTables() {
    const database = db!;

    database.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            character_name TEXT NOT NULL,
            character_description TEXT,
            character_image TEXT,
            story_type TEXT NOT NULL,
            plot_points TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scenes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            scene_number INTEGER NOT NULL,
            story_text TEXT NOT NULL,
            image_prompt TEXT NOT NULL,
            image_data TEXT,
            FOREIGN KEY (job_id) REFERENCES jobs(id),
            UNIQUE(job_id, scene_number)
        );

        CREATE INDEX IF NOT EXISTS idx_scenes_job_id ON scenes(job_id);
    `);
}

// Types
export interface Job {
    id: string;
    character_name: string;
    character_description: string | null;
    character_image: string | null;
    story_type: string;
    plot_points: string[];
    status: string;
    created_at: string;
}

export interface Scene {
    id: number;
    job_id: string;
    scene_number: number;
    story_text: string;
    image_prompt: string;
    image_data: string | null;
}

// Create a new job
export function createJob(
    characterName: string,
    characterDescription: string | null,
    characterImage: string | null,
    storyType: string,
    plotPoints: string[]
): string {
    const database = getDb();
    const jobId = uuidv4();

    const stmt = database.prepare(`
        INSERT INTO jobs (id, character_name, character_description, character_image, story_type, plot_points, status)
        VALUES (?, ?, ?, ?, ?, ?, 'generating')
    `);

    stmt.run(jobId, characterName, characterDescription, characterImage, storyType, JSON.stringify(plotPoints));

    return jobId;
}

// Save scenes for a job
export function saveScenes(jobId: string, scenes: { sceneNumber: number; storyText: string; imagePrompt: string }[]): void {
    const database = getDb();

    const stmt = database.prepare(`
        INSERT OR REPLACE INTO scenes (job_id, scene_number, story_text, image_prompt)
        VALUES (?, ?, ?, ?)
    `);

    const insertMany = database.transaction((scenesToInsert) => {
        for (const scene of scenesToInsert) {
            stmt.run(jobId, scene.sceneNumber, scene.storyText, scene.imagePrompt);
        }
    });

    insertMany(scenes);
}

// Update job status
export function updateJobStatus(jobId: string, status: string): void {
    const database = getDb();
    const stmt = database.prepare('UPDATE jobs SET status = ? WHERE id = ?');
    stmt.run(status, jobId);
}

// Get job by ID
export function getJob(jobId: string): Job | null {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM jobs WHERE id = ?');
    const row = stmt.get(jobId) as any;

    if (!row) return null;

    return {
        ...row,
        plot_points: JSON.parse(row.plot_points)
    };
}

// Get scenes for a job
export function getScenes(jobId: string): Scene[] {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM scenes WHERE job_id = ? ORDER BY scene_number');
    return stmt.all(jobId) as Scene[];
}

// Update scene with generated image
export function updateSceneImage(jobId: string, sceneNumber: number, imageData: string): void {
    const database = getDb();
    const stmt = database.prepare('UPDATE scenes SET image_data = ? WHERE job_id = ? AND scene_number = ?');
    stmt.run(imageData, jobId, sceneNumber);
}

// Get a single scene
export function getScene(jobId: string, sceneNumber: number): Scene | null {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM scenes WHERE job_id = ? AND scene_number = ?');
    return stmt.get(jobId, sceneNumber) as Scene | null;
}
