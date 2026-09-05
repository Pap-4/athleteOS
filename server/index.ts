import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Module registration (registerAuth, registerActivities, etc.) goes here in Phase 2

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});