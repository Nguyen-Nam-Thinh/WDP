const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { env } = require('./config/env');
const { connectDB } = require('./config/database');
const apiRoutes = require('./routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { startRaceStatusJob } = require('./jobs/raceStatus.job');

const app = express();

app.use(helmet());
const allowedOrigins = env.CLIENT_URL ? env.CLIENT_URL.split(',') : [];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', apiRoutes);

app.use(notFound);
app.use(errorHandler);

async function bootstrap() {
  await connectDB();
  startRaceStatusJob();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap();

module.exports = app;
