export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Plain JS endpoint works!',
    timestamp: new Date().toISOString(),
  });
}
