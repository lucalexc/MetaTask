import { 
  users, tracks, trackPillars, dailyTasks, userProgress, assessmentAnswers,
  type User, type InsertUser, type Track, type TrackPillar, type DailyTask, type UserProgress, type TrackWithDetails
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Tracks & Pillars
  getTrack(level: number): Promise<Track | undefined>;
  getTracks(): Promise<Track[]>;
  getTrackWithDetails(level: number): Promise<TrackWithDetails | undefined>;
  
  // Tasks & Progress
  getDailyTasks(trackId: number): Promise<DailyTask[]>;
  getTodayProgress(userId: number): Promise<UserProgress[]>;
  toggleTaskProgress(userId: number, taskId: number, date: string): Promise<void>;
  
  // Assessment
  saveAssessment(userId: number, answers: any): Promise<void>;

  // Seeding helpers
  createTrack(track: any): Promise<Track>;
  createTrackPillar(pillar: any): Promise<TrackPillar>;
  createDailyTask(task: any): Promise<DailyTask>;
  isEmpty(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getTrack(level: number): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.level, level));
    return track;
  }

  async getTracks(): Promise<Track[]> {
    return await db.select().from(tracks).orderBy(tracks.level);
  }

  async getTrackWithDetails(level: number): Promise<TrackWithDetails | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.level, level));
    if (!track) return undefined;

    const pillars = await db.select().from(trackPillars).where(eq(trackPillars.trackId, track.id));
    
    const pillarsWithTasks = await Promise.all(pillars.map(async (pillar) => {
      const tasks = await db.select().from(dailyTasks).where(eq(dailyTasks.trackPillarId, pillar.id));
      return { ...pillar, tasks };
    }));

    return { ...track, pillars: pillarsWithTasks };
  }

  async getDailyTasks(trackId: number): Promise<DailyTask[]> {
    // Join logic could be here, but getting by pillar is easier structure-wise
    return []; // Not strictly used if we use getTrackWithDetails
  }

  async getTodayProgress(userId: number): Promise<UserProgress[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.select().from(userProgress).where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completedAt, today)
      )
    );
  }

  async toggleTaskProgress(userId: number, taskId: number, date: string): Promise<void> {
    const [existing] = await db.select().from(userProgress).where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.taskId, taskId),
        eq(userProgress.completedAt, date)
      )
    );

    if (existing) {
      await db.delete(userProgress).where(eq(userProgress.id, existing.id));
    } else {
      await db.insert(userProgress).values({
        userId,
        taskId,
        completedAt: date,
        status: 'completed'
      });
    }
  }

  async saveAssessment(userId: number, answers: any): Promise<void> {
    await db.insert(assessmentAnswers).values({
      userId,
      answers,
    });
    // Also update lastAssessmentDate
    await db.update(users).set({ lastAssessmentDate: new Date() }).where(eq(users.id, userId));
  }

  // Seeding
  async createTrack(track: any): Promise<Track> {
    const [t] = await db.insert(tracks).values(track).returning();
    return t;
  }
  async createTrackPillar(pillar: any): Promise<TrackPillar> {
    const [p] = await db.insert(trackPillars).values(pillar).returning();
    return p;
  }
  async createDailyTask(task: any): Promise<DailyTask> {
    const [t] = await db.insert(dailyTasks).values(task).returning();
    return t;
  }
  async isEmpty(): Promise<boolean> {
    const [count] = await db.select({ count: sql<number>`count(*)` }).from(tracks);
    return Number(count.count) === 0;
  }
}

export const storage = new DatabaseStorage();
