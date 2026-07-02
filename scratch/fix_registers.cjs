const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(srcDir, '..');
const playerRegisterPath = path.join(parentDir, 'sportify-player', 'src', 'pages', 'Register.jsx');
const managerRegisterPath = path.join(parentDir, 'sportify-manager', 'src', 'pages', 'Register.jsx');
const originalRegisterPath = path.join(srcDir, 'src', 'pages', 'Register.jsx');

console.log('Restoring clean Register.jsx files...');

// 1. Copy clean files
fs.copyFileSync(originalRegisterPath, playerRegisterPath);
fs.copyFileSync(originalRegisterPath, managerRegisterPath);

// Target block to remove
const roleBlockToReplace = `          {/* Role Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Register account as
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('player')}
                className={\`py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center \${
                  role === 'player'
                    ? 'border-sport-green bg-sport-green/10 text-sport-green'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355'
                }\`}
              >
                Player
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={\`py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center \${
                  role === 'owner'
                    ? 'border-sport-green bg-sport-green/10 text-sport-green'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355'
                }\`}
              >
                Ground Owner
              </button>
            </div>
          </div>`;

// Alternates for styling variations
const roleBlockToReplaceAlt = `          {/* Role Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Register account as
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('player')}
                className={\`py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center \${
                  role === 'player'
                    ? 'border-sport-green bg-sport-green/10 text-sport-green'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350'
                }\`}
              >
                Player
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={\`py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center \${
                  role === 'owner'
                    ? 'border-sport-green bg-sport-green/10 text-sport-green'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350'
                }\`}
              >
                Ground Owner
              </button>
            </div>
          </div>`;

// 2. Adjust Player Register.jsx
let playerRegContent = fs.readFileSync(playerRegisterPath, 'utf8');
playerRegContent = playerRegContent.replace(
  "const [role, setRole] = useState('player'); // player or owner",
  "const role = 'player';"
);
playerRegContent = playerRegContent.replace(roleBlockToReplace, '');
playerRegContent = playerRegContent.replace(roleBlockToReplaceAlt, '');
fs.writeFileSync(playerRegisterPath, playerRegContent, 'utf8');
console.log('Player Register.jsx successfully repaired.');

// 3. Adjust Manager Register.jsx
let managerRegContent = fs.readFileSync(managerRegisterPath, 'utf8');
managerRegContent = managerRegContent.replace(
  "const [role, setRole] = useState('player'); // player or owner",
  "const role = 'owner';"
);
managerRegContent = managerRegContent.replace(roleBlockToReplace, '');
managerRegContent = managerRegContent.replace(roleBlockToReplaceAlt, '');
fs.writeFileSync(managerRegisterPath, managerRegContent, 'utf8');
console.log('Manager Register.jsx successfully repaired.');
