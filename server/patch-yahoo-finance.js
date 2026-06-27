import fs from 'fs';
import path from 'path';

const filePath = path.join('node_modules', 'yahoo-finance2', 'esm', 'src', 'lib', 'getCrumb.js');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  const target = '"User-Agent": `Mozilla/5.0 (compatible; ${pkg.name}/${pkg.version})`';
  const replacement = '"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"';
  
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched yahoo-finance2 User-Agent in getCrumb.js!');
  } else {
    console.log('getCrumb.js target not found or already patched.');
  }
} else {
  console.warn('getCrumb.js not found at', filePath);
}
