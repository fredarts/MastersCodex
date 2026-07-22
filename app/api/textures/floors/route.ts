import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), 'public', 'textures', 'battle-floors');
    
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json({ textures: [] });
    }

    const files = fs.readdirSync(dirPath);
    
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const textures = files
      .filter(file => validExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => ({
        name: file,
        url: `/textures/battle-floors/${file}`
      }));

    return NextResponse.json({ textures });
  } catch (error) {
    console.error('Error reading battle floors directory:', error);
    return NextResponse.json({ error: 'Failed to load textures' }, { status: 500 });
  }
}
