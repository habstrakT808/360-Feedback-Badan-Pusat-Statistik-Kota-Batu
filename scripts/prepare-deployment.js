const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing project for Hostinger deployment...\n');

try {
  // Clean previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }
  console.log('✅ Cleaned previous build\n');

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated\n');

  // Build project
  console.log('🏗️ Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Project built successfully\n');

  // Create deployment package
  console.log('📦 Creating deployment package...');
  const deploymentDir = 'deployment-package';
  
  if (fs.existsSync(deploymentDir)) {
    fs.rmSync(deploymentDir, { recursive: true, force: true });
  }
  fs.mkdirSync(deploymentDir);

  // Copy necessary files
  const filesToCopy = [
    '.next',
    'public',
    'package.json',
    'package-lock.json',
    'next.config.ts',
    'prisma',
    '.env.local'
  ];

  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      if (fs.statSync(file).isDirectory()) {
        fs.cpSync(file, path.join(deploymentDir, file), { recursive: true });
      } else {
        fs.copyFileSync(file, path.join(deploymentDir, file));
      }
      console.log(`✅ Copied ${file}`);
    } else {
      console.log(`⚠️  ${file} not found, skipping...`);
    }
  });

  // Create deployment instructions
  const instructions = `
# Hostinger Deployment Instructions

## Files to upload:
1. Upload all files in this folder to your Hostinger public_html directory
2. Make sure .env.local is uploaded with correct database configuration
3. Set proper file permissions (755 for directories, 644 for files)

## After upload:
1. SSH into your Hostinger server
2. Navigate to public_html directory
3. Run: npm install
4. Run: npx prisma generate
5. Run: npx prisma db push

## Verify deployment:
1. Check if website loads correctly
2. Test database connection
3. Test login functionality
4. Check all features work as expected

## Troubleshooting:
- Check error logs in hPanel
- Verify database connection
- Ensure all dependencies are installed
- Check file permissions
`;

  fs.writeFileSync(path.join(deploymentDir, 'DEPLOYMENT_INSTRUCTIONS.txt'), instructions);
  console.log('✅ Created deployment instructions\n');

  console.log('🎉 Deployment package created successfully!');
  console.log(`📁 Package location: ${deploymentDir}/`);
  console.log('\nNext steps:');
  console.log('1. Upload all files from deployment-package/ to Hostinger');
  console.log('2. Follow the instructions in DEPLOYMENT_INSTRUCTIONS.txt');
  console.log('3. Test your deployment');

} catch (error) {
  console.error('❌ Error preparing deployment:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check if all dependencies are installed');
  console.log('2. Verify your .env.local configuration');
  console.log('3. Ensure you have write permissions');
  process.exit(1);
}
