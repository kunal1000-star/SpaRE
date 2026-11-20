const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

async function main() {
  const dir = path.resolve('.');
  
  // Initialize repository
  console.log('Initializing repository...');
  await git.init({ fs, dir, defaultBranch: 'main' });
  console.log('Initialized repo in', dir);

  // Read ignore rules manually
  const ignorePatterns = [
    'node_modules',
    'dist',
    'dist-ssr',
    '*.local',
    '.env',
    '.env.local',
    '.DS_Store',
    '.neon',
    '.agent',
    '.git',
    'scratch_git.js'
  ];

  function isIgnored(relPath) {
    const parts = relPath.split(/[/\\]/);
    for (const part of parts) {
      if (part === 'node_modules' || part === 'dist' || part === '.git' || part === '.neon' || part === '.agent') return true;
      if (part === '.env' || part === '.env.local') return true;
    }
    return false;
  }

  function getFiles(currentDir, baseDir = dir) {
    let results = [];
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      if (isIgnored(relPath)) continue;
      if (entry.isDirectory()) {
        results = results.concat(getFiles(fullPath, baseDir));
      } else {
        results.push(relPath);
      }
    }
    return results;
  }

  const files = getFiles(dir);
  console.log(`Adding ${files.length} files...`);

  for (const filepath of files) {
    await git.add({ fs, dir, filepath });
  }

  console.log('Committing changes...');
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'Kunal Rajak',
      email: 'kunalrajak1000@gmail.com'
    },
    message: 'feat: SpaRE v1.0 - Spaced Revision Engine with high refresh 165Hz optimization, syllabus management & Neon DB sync'
  });

  console.log('Commit successful! SHA:', sha);

  // Set remote
  const remoteUrl = 'https://github.com/kunal1000-star/SpaRE.git';
  await git.addRemote({
    fs,
    dir,
    remote: 'origin',
    url: remoteUrl,
    force: true
  });
  console.log('Remote set to:', remoteUrl);
}

main().catch(err => {
  console.error('Error during git operation:', err);
  process.exit(1);
});
