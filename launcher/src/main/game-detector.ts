/**
 * Game Detection Module
 * Detects games installed via Steam, Epic Games, Battle.net, GOG, and Game Pass
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

export interface DetectedGame {
  id: string;
  name: string;
  exePath: string;
  platform: 'steam' | 'epic' | 'battlenet' | 'gog' | 'gamepass' | 'custom';
  installDir: string;
  version?: string;
  lastPlayed?: Date;
}

export class GameDetector {
  private username = os.userInfo().username;

  /**
   * Detect all installed games
   */
  async detectAllGames(): Promise<DetectedGame[]> {
    const games: DetectedGame[] = [];

    try {
      const steamGames = await this.detectSteamGames();
      games.push(...steamGames);
    } catch (e) {
      console.error('Error detecting Steam games:', e);
    }

    try {
      const epicGames = await this.detectEpicGames();
      games.push(...epicGames);
    } catch (e) {
      console.error('Error detecting Epic games:', e);
    }

    try {
      const battleNetGames = await this.detectBattleNetGames();
      games.push(...battleNetGames);
    } catch (e) {
      console.error('Error detecting Battle.net games:', e);
    }

    try {
      const gogGames = await this.detectGOGGames();
      games.push(...gogGames);
    } catch (e) {
      console.error('Error detecting GOG games:', e);
    }

    try {
      const gamePassGames = await this.detectGamePassGames();
      games.push(...gamePassGames);
    } catch (e) {
      console.error('Error detecting Game Pass games:', e);
    }

    return games;
  }

  /**
   * Detect Steam games via registry and manifest files
   */
  private async detectSteamGames(): Promise<DetectedGame[]> {
    const games: DetectedGame[] = [];
    const steamPaths = [
      'C:\\Program Files (x86)\\Steam',
      'C:\\Program Files\\Steam',
      `C:\\Users\\${this.username}\\AppData\\Local\\Steam`
    ];

    for (const steamPath of steamPaths) {
      if (!fs.existsSync(steamPath)) continue;

      const steamAppsPath = path.join(steamPath, 'steamapps');
      if (!fs.existsSync(steamAppsPath)) continue;

      try {
        const directories = fs.readdirSync(steamAppsPath);
        
        for (const dir of directories) {
          if (!dir.startsWith('common')) continue;

          const commonDir = path.join(steamAppsPath, dir);
          const files = fs.readdirSync(commonDir);

          // Look for executable files
          for (const file of files) {
            if (file.endsWith('.exe') && !file.includes('unins')) {
              const exePath = path.join(commonDir, file);
              const gameName = dir.replace('common\\', '');

              games.push({
                id: `steam-${gameName}`,
                name: gameName,
                exePath,
                platform: 'steam',
                installDir: commonDir
              });
              break;
            }
          }
        }
      } catch (e) {
        console.error('Error reading Steam directory:', e);
      }
    }

    return games;
  }

  /**
   * Detect Epic Games via Windows registry
   */
  private async detectEpicGames(): Promise<DetectedGame[]> {
    const games: DetectedGame[] = [];

    try {
      // Query registry for Epic Games manifest location
      const manifestDir = `C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests`;

      if (!fs.existsSync(manifestDir)) {
        // Fallback to standard installation directory
        const epicPath = 'C:\\Program Files\\Epic Games';
        if (fs.existsSync(epicPath)) {
          const dirs = fs.readdirSync(epicPath);
          for (const dir of dirs) {
            const gamePath = path.join(epicPath, dir);
            const files = fs.readdirSync(gamePath);
            
            for (const file of files) {
              if (file.endsWith('.exe') && !file.includes('launcher')) {
                games.push({
                  id: `epic-${dir}`,
                  name: dir,
                  exePath: path.join(gamePath, file),
                  platform: 'epic',
                  installDir: gamePath
                });
                break;
              }
            }
          }
        }
        return games;
      }

      // Parse manifest files
      const manifests = fs.readdirSync(manifestDir);
      for (const manifest of manifests) {
        if (!manifest.endsWith('.item')) continue;

        try {
          const content = fs.readFileSync(path.join(manifestDir, manifest), 'utf-8');
          const data = JSON.parse(content);

          const exePath = data.InstallLocation;
          if (exePath && fs.existsSync(exePath)) {
            games.push({
              id: `epic-${data.DisplayName}`,
              name: data.DisplayName,
              exePath,
              platform: 'epic',
              installDir: exePath,
              version: data.AppVersion
            });
          }
        } catch (e) {
          console.error(`Error parsing manifest ${manifest}:`, e);
        }
      }
    } catch (e) {
      console.error('Error detecting Epic games:', e);
    }

    return games;
  }

  /**
   * Detect Battle.net games
   */
  private async detectBattleNetGames(): Promise<DetectedGame[]> {
    const games: DetectedGame[] = [];
    const battleNetPath = 'C:\\Program Files (x86)\\Battle.net';

    if (!fs.existsSync(battleNetPath)) {
      return games;
    }

    // Common Battle.net game directory
    const gamesDirPath = path.join(battleNetPath, 'Games');
    if (!fs.existsSync(gamesDirPath)) {
      return games;
    }

    try {
      const directories = fs.readdirSync(gamesDirPath);
      
      for (const dir of directories) {
        const gamePath = path.join(gamesDirPath, dir);
        const files = fs.readdirSync(gamePath);

        for (const file of files) {
          if (file.endsWith('.exe') && !file.includes('launcher')) {
            games.push({
              id: `battlenet-${dir}`,
              name: dir,
              exePath: path.join(gamePath, file),
              platform: 'battlenet',
              installDir: gamePath
            });
            break;
          }
        }
      }
    } catch (e) {
      console.error('Error detecting Battle.net games:', e);
    }

    return games;
  }

  /**
   * Detect GOG games
   */
  private async detectGOGGames(): Promise<DetectedGame[]> {
    const games: DetectedGame[] = [];

    // GOG typically installs to custom locations, check common paths
    const commonGOGPaths = [
      'C:\\GOG Games',
      `C:\\Users\\${this.username}\\Games`,
      'D:\\GOG Games',
      'D:\\Games'
    ];

    for (const basePath of commonGOGPaths) {
      if (!fs.existsSync(basePath)) continue;

      try {
        const directories = fs.readdirSync(basePath);

        for (const dir of directories) {
          const gamePath = path.join(basePath, dir);
          if (!fs.statSync(gamePath).isDirectory()) continue;

          const files = fs.readdirSync(gamePath);
          for (const file of files) {
            if (file.endsWith('.exe') && !file.includes('unins')) {
              games.push({
                id: `gog-${dir}`,
                name: dir,
                exePath: path.join(gamePath, file),
                platform: 'gog',
                installDir: gamePath
              });
              break;
            }
          }
        }
      } catch (e) {
        console.error(`Error checking GOG path ${basePath}:`, e);
      }
    }

    return games;
  }

  /**
   * Detect Game Pass games
   */
  private async detectGamePassGames(): Promise<DetectedGame[]> {
    const games: DetectedGame[] = [];

    try {
      // Game Pass games are typically installed in Program Files or C:\Program Files
      const gamePassRoots = [
        'C:\\Program Files\\WindowsApps',
        'C:\\XboxGames'
      ];

      for (const root of gamePassRoots) {
        if (!fs.existsSync(root)) continue;

        try {
          const directories = fs.readdirSync(root);

          for (const dir of directories) {
            const dirPath = path.join(root, dir);
            if (!fs.statSync(dirPath).isDirectory()) continue;

            // Look for game executables
            this.findExecutablesInDirectory(dirPath).forEach(exePath => {
              games.push({
                id: `gamepass-${dir}`,
                name: dir,
                exePath,
                platform: 'gamepass',
                installDir: dirPath
              });
            });
          }
        } catch (e) {
          console.error(`Error reading Game Pass directory ${root}:`, e);
        }
      }
    } catch (e) {
      console.error('Error detecting Game Pass games:', e);
    }

    return games;
  }

  /**
   * Find all executable files in a directory recursively
   */
  private findExecutablesInDirectory(dir: string, maxDepth: number = 2, currentDepth: number = 0): string[] {
    const executables: string[] = [];

    if (currentDepth >= maxDepth) return executables;

    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        try {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            executables.push(...this.findExecutablesInDirectory(fullPath, maxDepth, currentDepth + 1));
          } else if (file.endsWith('.exe') && !file.includes('unins') && file.length < 50) {
            executables.push(fullPath);
            if (executables.length >= 3) break; // Limit to first 3 executables
          }
        } catch (e) {
          // Skip files we can't read
        }
      }
    } catch (e) {
      console.error(`Error reading directory ${dir}:`, e);
    }

    return executables;
  }

  /**
   * Validate game executable exists and is accessible
   */
  validateGamePath(exePath: string): boolean {
    return fs.existsSync(exePath) && fs.statSync(exePath).isFile();
  }

  /**
   * Get game metadata from executable properties
   */
  async getGameMetadata(exePath: string): Promise<{ version?: string; company?: string }> {
    try {
      // This would require additional libraries or COM interaction on Windows
      // For now, return empty metadata
      return {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Scan for custom game installations in common locations
   */
  async scanCustomGameLocations(): Promise<DetectedGame[]> {
    const games: DetectedGame[] = [];
    const customPaths = [
      'C:\\Games',
      `D:\\Games`,
      `D:\\${this.username}\\Games`,
      `C:\\Users\\${this.username}\\Games`,
      `C:\\Users\\${this.username}\\Desktop\\Games`
    ];

    for (const scanPath of customPaths) {
      if (!fs.existsSync(scanPath)) continue;

      try {
        const items = fs.readdirSync(scanPath);

        for (const item of items) {
          const itemPath = path.join(scanPath, item);
          if (!fs.statSync(itemPath).isDirectory()) continue;

          const executables = this.findExecutablesInDirectory(itemPath, 2);
          for (const exePath of executables) {
            games.push({
              id: `custom-${path.basename(itemPath)}`,
              name: path.basename(itemPath),
              exePath,
              platform: 'custom',
              installDir: itemPath
            });
            break;
          }
        }
      } catch (e) {
        console.error(`Error scanning ${scanPath}:`, e);
      }
    }

    return games;
  }
}

export default new GameDetector();
