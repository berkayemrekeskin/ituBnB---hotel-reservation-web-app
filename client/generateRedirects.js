import fs from 'node:fs';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';

const redirectContent = `/api/*  ${backendUrl}/api/:splat  200\n`;

if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public');
}

fs.writeFileSync('./public/_redirects', redirectContent);

console.log(`✅ Generated _redirects file pointing to: ${backendUrl}`);
