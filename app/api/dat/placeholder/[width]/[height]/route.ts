import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ width: string; height: string }> }) {
  const { width, height } = await context.params;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#ddd"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#aaa" font-size="12">${width} x ${height}</text>
  </svg>`;
  return new NextResponse(svg, {
    headers: { 'content-type': 'image/svg+xml' }
  });
}