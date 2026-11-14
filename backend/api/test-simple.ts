export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    message: 'Test simple endpoint works!',
    timestamp: new Date().toISOString(),
  });
}
