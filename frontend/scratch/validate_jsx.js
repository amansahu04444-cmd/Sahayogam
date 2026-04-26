
import fs from 'fs';
import { parse } from '@babel/parser';

const files = [
  'c:/Users/amans/OneDrive/Desktop/GDG/frontend/src/pages/NGODashboard.jsx',
  'c:/Users/amans/OneDrive/Desktop/GDG/frontend/src/pages/TaskManagement.jsx',
  'c:/Users/amans/OneDrive/Desktop/GDG/frontend/src/pages/OCRProcessingPage.jsx',
  'c:/Users/amans/OneDrive/Desktop/GDG/frontend/src/layouts/SidebarLayout.jsx',
  'c:/Users/amans/OneDrive/Desktop/GDG/frontend/src/components/Sidebar.jsx'
];

files.forEach(file => {
  try {
    const code = fs.readFileSync(file, 'utf8');
    parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
    console.log(`${file}: VALID`);
  } catch (e) {
    console.error(`${file}: ERROR`);
    console.error(e.message);
    console.error(e.loc);
  }
});
