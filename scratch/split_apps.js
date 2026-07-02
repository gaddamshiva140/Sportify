const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(srcDir, '..');
const playerDir = path.join(parentDir, 'sportify-player');
const managerDir = path.join(parentDir, 'sportify-manager');

console.log('Starting Sportify application split...');

// Helper to copy directory recursively
function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

// Create output dirs
fs.mkdirSync(playerDir, { recursive: true });
fs.mkdirSync(managerDir, { recursive: true });

const filesToCopy = [
  'index.html',
  'package.json',
  'package-lock.json',
  'vite.config.js',
  '.env',
  '.env.example',
  '.gitignore',
  'public',
  'src'
];

// 1. Copy files
filesToCopy.forEach(item => {
  const itemSrc = path.join(srcDir, item);
  if (fs.existsSync(itemSrc)) {
    copyDir(itemSrc, path.join(playerDir, item));
    copyDir(itemSrc, path.join(managerDir, item));
    console.log(`Copied ${item} to both player and manager projects.`);
  }
});

// 2. Adjust sportify-player
console.log('Adjusting player app config...');

// Player App.jsx adjustment
const playerAppPath = path.join(playerDir, 'src', 'App.jsx');
let playerAppContent = fs.readFileSync(playerAppPath, 'utf8');

// Remove Admin route imports
playerAppContent = playerAppContent.replace(/import AdminDashboard from '\.\/pages\/AdminDashboard';/g, '');
playerAppContent = playerAppContent.replace(/import AddGround from '\.\/pages\/AddGround';/g, '');
playerAppContent = playerAppContent.replace(/import ManageGrounds from '\.\/pages\/ManageGrounds';/g, '');
playerAppContent = playerAppContent.replace(/import SlotManagement from '\.\/pages\/SlotManagement';/g, '');
playerAppContent = playerAppContent.replace(/import RevenueDashboard from '\.\/pages\/RevenueDashboard';/g, '');
playerAppContent = playerAppContent.replace(/import OwnerPortal from '\.\/pages\/OwnerPortal';/g, '');

// Simplify DashboardRedirect
playerAppContent = playerAppContent.replace(
  /function DashboardRedirect\(\) \{[\s\S]*?\}/,
  `function DashboardRedirect() {\n  return <UserDashboard />;\n}`
);

// Remove Admin Routes
playerAppContent = playerAppContent.replace(
  /<Route\s+path="\/admin"[\s\S]*?<\/AdminRoute>\s*\}\s*\/>/g,
  ''
);
playerAppContent = playerAppContent.replace(
  /<Route\s+path="\/admin\/add-ground"[\s\S]*?<\/AdminRoute>\s*\}\s*\/>/g,
  ''
);
playerAppContent = playerAppContent.replace(
  /<Route\s+path="\/manage-grounds"[\s\S]*?<\/AdminRoute>\s*\}\s*\/>/g,
  ''
);
playerAppContent = playerAppContent.replace(
  /<Route\s+path="\/admin\/slots\/:groundId"[\s\S]*?<\/AdminRoute>\s*\}\s*\/>/g,
  ''
);
playerAppContent = playerAppContent.replace(
  /<Route\s+path="\/admin\/revenue"[\s\S]*?<\/AdminRoute>\s*\}\s*\/>/g,
  ''
);
playerAppContent = playerAppContent.replace(
  /<Route path="\/owners" element=\{<OwnerPortal \/>\} \/>/g,
  ''
);

fs.writeFileSync(playerAppPath, playerAppContent, 'utf8');

// Player Navbar.jsx adjustments
const playerNavbarPath = path.join(playerDir, 'src', 'components', 'Navbar.jsx');
let playerNavbar = fs.readFileSync(playerNavbarPath, 'utf8');
playerNavbar = playerNavbar.replace(/<Link to="\/owners" className=\{activeClass\('\/owners'\)\}>Owners Portal<\/Link>/g, '');
playerNavbar = playerNavbar.replace(/<Link\s+to="\/owners"[\s\S]*?Owners Portal\s*<\/Link>/g, '');
// Force dashboard redirection
playerNavbar = playerNavbar.replace(/isAdmin \? '\/admin' : '\/dashboard'/g, "'/dashboard'");
fs.writeFileSync(playerNavbarPath, playerNavbar, 'utf8');

// Player Login.jsx - remove owner helper cards
const playerLoginPath = path.join(playerDir, 'src', 'pages', 'Login.jsx');
let playerLogin = fs.readFileSync(playerLoginPath, 'utf8');
playerLogin = playerLogin.replace(/<button\s+onClick=\{\(\) => autofillDemo\('owner@sportify\.com'\)\}[\s\S]*?<\/button>/g, '');
fs.writeFileSync(playerLoginPath, playerLogin, 'utf8');

// Player Register.jsx - remove role toggles (always register as player)
const playerRegisterPath = path.join(playerDir, 'src', 'pages', 'Register.jsx');
let playerRegister = fs.readFileSync(playerRegisterPath, 'utf8');
playerRegister = playerRegister.replace(/const \[role, setRole\] = useState\('player'\);/g, "const role = 'player';");
playerRegister = playerRegister.replace(/\{.*?Role Selection.*?aria-label.*?<\/div>\s*<\/div>/gs, ''); // strip block
playerRegister = playerRegister.replace(/\{.*?Register account as.*?Owner.*?<\/div>\s*<\/div>/gs, ''); // strip block alternate
fs.writeFileSync(playerRegisterPath, playerRegister, 'utf8');

// 3. Adjust sportify-manager
console.log('Adjusting manager app config...');

// Manager App.jsx adjustment
const managerAppPath = path.join(managerDir, 'src', 'App.jsx');
let managerAppContent = fs.readFileSync(managerAppPath, 'utf8');

// Remove Player route imports
managerAppContent = managerAppContent.replace(/import Explore from '\.\/pages\/Explore';/g, '');
managerAppContent = managerAppContent.replace(/import Categories from '\.\/pages\/Categories';/g, '');
managerAppContent = managerAppContent.replace(/import GroundDetails from '\.\/pages\/GroundDetails';/g, '');
managerAppContent = managerAppContent.replace(/import BookingPage from '\.\/pages\/BookingPage';/g, '');
managerAppContent = managerAppContent.replace(/import BookingHistory from '\.\/pages\/BookingHistory';/g, '');
managerAppContent = managerAppContent.replace(/import PlayerPortal from '\.\/pages\/PlayerPortal';/g, '');
managerAppContent = managerAppContent.replace(/import UserDashboard from '\.\/pages\/UserDashboard';/g, '');

// Simplify DashboardRedirect
managerAppContent = managerAppContent.replace(
  /function DashboardRedirect\(\) \{[\s\S]*?\}/,
  `function DashboardRedirect() {\n  return <AdminDashboard />;\n}`
);

// Remove Player Routes
managerAppContent = managerAppContent.replace(
  /<Route path="\/explore" element=\{<Explore \/>\} \/>/g,
  ''
);
managerAppContent = managerAppContent.replace(
  /<Route path="\/categories" element=\{<Categories \/>\} \/>/g,
  ''
);
managerAppContent = managerAppContent.replace(
  /<Route path="\/ground\/:id" element=\{<GroundDetails \/>\} \/>/g,
  ''
);
managerAppContent = managerAppContent.replace(
  /<Route\s+path="\/booking"[\s\S]*?<\/ProtectedRoute>\s*\}\s*\/>/g,
  ''
);
managerAppContent = managerAppContent.replace(
  /<Route\s+path="\/dashboard"[\s\S]*?<\/ProtectedRoute>\s*\}\s*\/>/g,
  ''
);
managerAppContent = managerAppContent.replace(
  /<Route\s+path="\/history"[\s\S]*?<\/ProtectedRoute>\s*\}\s*\/>/g,
  ''
);
managerAppContent = managerAppContent.replace(
  /<Route path="\/players" element=\{<PlayerPortal \/>\} \/>/g,
  ''
);

fs.writeFileSync(managerAppPath, managerAppContent, 'utf8');

// Manager Navbar.jsx adjustments - keep only home, owners dashboard, categories
const managerNavbarPath = path.join(managerDir, 'src', 'components', 'Navbar.jsx');
let managerNavbar = fs.readFileSync(managerNavbarPath, 'utf8');
managerNavbar = managerNavbar.replace(/<Link to="\/players" className=\{activeClass\('\/players'\)\}>Players Portal<\/Link>/g, '');
managerNavbar = managerNavbar.replace(/<Link\s+to="\/players"[\s\S]*?Players Portal\s*<\/Link>/g, '');
managerNavbar = managerNavbar.replace(/<Link to="\/explore" className=\{activeClass\('\/explore'\)\}>Explore Grounds<\/Link>/g, '');
managerNavbar = managerNavbar.replace(/<Link\s+to="\/explore"[\s\S]*?Explore Grounds\s*<\/Link>/g, '');
managerNavbar = managerNavbar.replace(/isAdmin \? '\/admin' : '\/dashboard'/g, "'/admin'");
fs.writeFileSync(managerNavbarPath, managerNavbar, 'utf8');

// Manager Login.jsx - remove player helper cards, default to owner
const managerLoginPath = path.join(managerDir, 'src', 'pages', 'Login.jsx');
let managerLogin = fs.readFileSync(managerLoginPath, 'utf8');
managerLogin = managerLogin.replace(/<button\s+onClick=\{\(\) => autofillDemo\('player@sportify\.com'\)\}[\s\S]*?<\/button>/g, '');
fs.writeFileSync(managerLoginPath, managerLogin, 'utf8');

// Manager Register.jsx - force owner role, remove options
const managerRegisterPath = path.join(managerDir, 'src', 'pages', 'Register.jsx');
let managerRegister = fs.readFileSync(managerRegisterPath, 'utf8');
managerRegister = managerRegister.replace(/const \[role, setRole\] = useState\('player'\);/g, "const role = 'owner';");
managerRegister = managerRegister.replace(/\{.*?Role Selection.*?aria-label.*?<\/div>\s*<\/div>/gs, ''); // strip block
managerRegister = managerRegister.replace(/\{.*?Register account as.*?Player.*?<\/div>\s*<\/div>/gs, ''); // strip block alternate
fs.writeFileSync(managerRegisterPath, managerRegister, 'utf8');

// Swap Home.jsx in manager-app to display OwnerPortal design directly!
const managerHomePath = path.join(managerDir, 'src', 'pages', 'Home.jsx');
const ownerPortalPath = path.join(managerDir, 'src', 'pages', 'OwnerPortal.jsx');
if (fs.existsSync(ownerPortalPath)) {
  fs.copyFileSync(ownerPortalPath, managerHomePath);
  console.log('Swapped manager app homepage to OwnerPortal landing layout.');
}

console.log('Sportify split operation completed successfully.');
