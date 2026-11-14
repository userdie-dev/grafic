export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Root level endpoint works!',
    timestamp: new Date().toISOString(),
  });
}
