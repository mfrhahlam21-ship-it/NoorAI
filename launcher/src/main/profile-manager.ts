/**
 * Profile Management Module
 * Handles saving, loading, and applying user optimization profiles
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export interface OptimizationProfile {
  id: string;
  name: string;
  gameId?: string;
  gameName?: string;
  settings: {
    cpuPriority: 'high' | 'above-normal' | 'normal' | 'below-normal' | 'low';
    cpuAffinity?: number[]; // CPU core indices
    powerPlan: 'high-performance' | 'balanced' | 'power-saver';
    gpuClockOffset?: number; // MHz
    gpuMemoryClockOffset?: number; // MHz
    gpuPowerLimit?: number; // 50-100%
    targetFps?: number;
    resolutionScale?: number; // 0.5 - 1.0
    textureQuality?: 'ultra' | 'high' | 'medium' | 'low';
    shadowQuality?: 'ultra' | 'high' | 'medium' | 'low' | 'off';
    dlssEnabled?: boolean;
    dlssQuality?: 'quality' | 'balanced' | 'performance' | 'ultra-performance';
    rayTracingEnabled?: boolean;
    virtualMemorySize?: number; // MB
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    appliedCount: number;
    notes: string;
  };
}

export class ProfileManager {
  private profilesDir: string;
  private profilesFile: string;
  private profiles: Map<string, OptimizationProfile> = new Map();

  constructor() {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    this.profilesDir = path.join(appData, 'NoorAI', 'Profiles');
    this.profilesFile = path.join(this.profilesDir, 'profiles.json');

    this.ensureProfilesDirectory();
    this.loadProfiles();
  }

  /**
   * Ensure profiles directory exists
   */
  private ensureProfilesDirectory(): void {
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  /**
   * Load profiles from disk
   */
  private loadProfiles(): void {
    try {
      if (fs.existsSync(this.profilesFile)) {
        const data = fs.readFileSync(this.profilesFile, 'utf-8');
        const profiles = JSON.parse(data);

        for (const profile of profiles) {
          profile.metadata.createdAt = new Date(profile.metadata.createdAt);
          profile.metadata.updatedAt = new Date(profile.metadata.updatedAt);
          this.profiles.set(profile.id, profile);
        }
      }
    } catch (e) {
      console.error('Error loading profiles:', e);
    }
  }

  /**
   * Save profiles to disk
   */
  private saveProfiles(): void {
    try {
      const profilesArray = Array.from(this.profiles.values());
      fs.writeFileSync(this.profilesFile, JSON.stringify(profilesArray, null, 2));
    } catch (e) {
      console.error('Error saving profiles:', e);
    }
  }

  /**
   * Create a new profile
   */
  createProfile(profile: Omit<OptimizationProfile, 'id' | 'metadata'>): OptimizationProfile {
    const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newProfile: OptimizationProfile = {
      ...profile,
      id,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedCount: 0,
        notes: profile.gameId ? `Auto-profile for ${profile.gameName}` : 'Custom profile'
      }
    };

    this.profiles.set(id, newProfile);
    this.saveProfiles();

    return newProfile;
  }

  /**
   * Get profile by ID
   */
  getProfile(id: string): OptimizationProfile | null {
    return this.profiles.get(id) || null;
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): OptimizationProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get profiles for a specific game
   */
  getGameProfiles(gameId: string): OptimizationProfile[] {
    return Array.from(this.profiles.values()).filter(p => p.gameId === gameId);
  }

  /**
   * Update profile
   */
  updateProfile(id: string, updates: Partial<OptimizationProfile>): OptimizationProfile | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;

    const updated: OptimizationProfile = {
      ...profile,
      ...updates,
      id: profile.id,
      metadata: {
        ...profile.metadata,
        updatedAt: new Date()
      }
    };

    this.profiles.set(id, updated);
    this.saveProfiles();

    return updated;
  }

  /**
   * Delete profile
   */
  deleteProfile(id: string): boolean {
    const deleted = this.profiles.delete(id);
    if (deleted) {
      this.saveProfiles();
    }
    return deleted;
  }

  /**
   * Mark profile as applied
   */
  markProfileApplied(id: string): void {
    const profile = this.profiles.get(id);
    if (profile) {
      profile.metadata.appliedCount++;
      profile.metadata.updatedAt = new Date();
      this.profiles.set(id, profile);
      this.saveProfiles();
    }
  }

  /**
   * Get default profiles
   */
  static getDefaultProfiles(): OptimizationProfile[] {
    return [
      {
        id: 'default-gaming',
        name: 'Balanced Gaming',
        settings: {
          cpuPriority: 'high',
          powerPlan: 'high-performance',
          gpuPowerLimit: 100,
          targetFps: 144,
          textureQuality: 'high',
          shadowQuality: 'high',
          dlssEnabled: true,
          dlssQuality: 'balanced',
          rayTracingEnabled: true
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          appliedCount: 0,
          notes: 'Default balanced gaming profile'
        }
      },
      {
        id: 'default-competitive',
        name: 'Competitive FPS',
        settings: {
          cpuPriority: 'high',
          powerPlan: 'high-performance',
          gpuPowerLimit: 100,
          targetFps: 240,
          textureQuality: 'medium',
          shadowQuality: 'low',
          dlssEnabled: true,
          dlssQuality: 'performance',
          rayTracingEnabled: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          appliedCount: 0,
          notes: 'Optimized for competitive FPS games'
        }
      },
      {
        id: 'default-power-saver',
        name: 'Power Saver',
        settings: {
          cpuPriority: 'normal',
          powerPlan: 'power-saver',
          gpuPowerLimit: 75,
          targetFps: 60,
          textureQuality: 'medium',
          shadowQuality: 'medium',
          dlssEnabled: true,
          dlssQuality: 'performance',
          rayTracingEnabled: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          appliedCount: 0,
          notes: 'Battery-optimized profile for laptops'
        }
      }
    ];
  }

  /**
   * Export profile as JSON
   */
  exportProfile(id: string): string | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile from JSON
   */
  importProfile(json: string): OptimizationProfile | null {
    try {
      const data = JSON.parse(json);
      if (!data.name || !data.settings) return null;

      const profile: OptimizationProfile = {
        id: `imported-${Date.now()}`,
        name: data.name,
        gameId: data.gameId,
        gameName: data.gameName,
        settings: data.settings,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          appliedCount: 0,
          notes: 'Imported profile'
        }
      };

      this.profiles.set(profile.id, profile);
      this.saveProfiles();

      return profile;
    } catch (e) {
      console.error('Error importing profile:', e);
      return null;
    }
  }

  /**
   * Get profile statistics
   */
  getStatistics() {
    const profiles = Array.from(this.profiles.values());
    const totalApplied = profiles.reduce((sum, p) => sum + p.metadata.appliedCount, 0);
    const mostUsed = profiles.reduce((prev, curr) => 
      (prev.metadata.appliedCount || 0) < (curr.metadata.appliedCount || 0) ? curr : prev
    );

    return {
      totalProfiles: profiles.length,
      totalApplications: totalApplied,
      mostUsedProfile: mostUsed ? { id: mostUsed.id, name: mostUsed.name, applied: mostUsed.metadata.appliedCount } : null,
      averageApplications: profiles.length > 0 ? totalApplied / profiles.length : 0
    };
  }
}

export default new ProfileManager();
