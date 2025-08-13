// scripts/create-dotfiles.js
const fs = require('fs');
const path = require('path');

const root = process.cwd();

const gitignore = `# Node / Next
node_modules/
.next/
out/
dist/
build/
.cache/

# Env & local config
.env
.env.local
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS/Editor
.DS_Store
Thumbs.db
.vscode/
.idea/

# Coverage
coverage/
`;

const gitattributes = `* text=auto eol=lf

# Keep Windows batch scripts CRLF if you use any
*.bat text eol=crlf
`;

fs.writeFileSync(path.join(root, '.gitignore'), gitignore, 'utf8');
fs.writeFileSync(path.join(root, '.gitattributes'), gitattributes, 'utf8');

console.log('✓ .gitignore and .gitattributes written to', root);
