// Test endpoint - копия health.ts
export default async function handler(req: any, res: any) {
  res.status(200).json({
    status: 'working',
    message: 'This is a copy of health endpoint',
    timestamp: new Date().toISOString(),
  });
}
