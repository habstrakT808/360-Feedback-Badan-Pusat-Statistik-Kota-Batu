const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Skip node_modules and other directories
      if (!['node_modules', '.next', 'dist', 'build'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to update file content
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove Supabase imports
    if (content.includes("from '@/lib/supabase'") || content.includes("from '@/lib/supabase-admin'")) {
      content = content.replace(/import.*from\s+['"]@\/lib\/supabase['"];?\n?/g, '');
      content = content.replace(/import.*from\s+['"]@\/lib\/supabase-admin['"];?\n?/g, '');
      modified = true;
    }
    
    // Remove Database type imports
    if (content.includes("from '@/lib/database.types'")) {
      content = content.replace(/import.*Database.*from\s+['"]@\/lib\/database\.types['"];?\n?/g, '');
      modified = true;
    }
    
    // Remove SupabaseErrorBoundary imports
    if (content.includes("SupabaseErrorBoundary")) {
      content = content.replace(/import.*SupabaseErrorBoundary.*from.*;?\n?/g, '');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to check...`);

let updatedCount = 0;
files.forEach(file => {
  if (updateFile(file)) {
    updatedCount++;
  }
});

console.log(`Updated ${updatedCount} files`);
