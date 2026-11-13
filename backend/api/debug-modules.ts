import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

export default async function handler(req: any, res: any) {
  try {
    const results: any = {
      cwd: process.cwd(),
      nodeModulesExists: false,
      pgExists: false,
      pgPackageJson: null,
      taskPath: null,
    };

    // Проверяем разные возможные пути
    const possiblePaths = [
      'node_modules',
      '../node_modules',
      '../../node_modules',
      '/var/task/node_modules',
      '/var/task/backend/node_modules',
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        results[`exists_${path}`] = true;
        
        const pgPath = join(path, 'pg');
        if (existsSync(pgPath)) {
          results.pgExists = true;
          results.pgPath = pgPath;
          
          const packageJsonPath = join(pgPath, 'package.json');
          if (existsSync(packageJsonPath)) {
            const packageJson = require(packageJsonPath);
            results.pgPackageJson = {
              name: packageJson.name,
              version: packageJson.version,
            };
          }
          break;
        }
      }
    }

    // Проверяем /var/task
    if (existsSync('/var/task')) {
      results.taskPath = readdirSync('/var/task').slice(0, 20);
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
