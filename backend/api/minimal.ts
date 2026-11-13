export default async function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    message: 'Minimal endpoint works',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
  });
}
