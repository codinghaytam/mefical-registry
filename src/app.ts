import createError from 'http-errors';
import express, { Request, Response, NextFunction, Express } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import cors from 'cors';

import usersRouter from './routes/users.js';
import medecinRouter from './routes/medecin.js';
import etudiantRouter from './routes/etudiant.js';
import adminRouter from './routes/admin.js';
import patientRouter from './routes/patient.js';
import consultationRouter from './routes/consultation.js';
import diagnostiqueRouter from './routes/diagnostique.js';
import actionsRouter from './routes/actions.js';
import seanceRouter from './routes/seance.js';
import enumRouter from './routes/enums.js';
import reevaluationRouter from './routes/reevaluation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

// CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// view engine setup

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Serve files from images directory
app.use('/uploads', express.static(path.join(__dirname, '../upload')),function(req,res,next){
});

app.use('/users', usersRouter);
app.use('/medecin', medecinRouter);
app.use('/etudiant', etudiantRouter);
app.use('/admin', adminRouter);
app.use('/patient', patientRouter);
app.use('/consultation', consultationRouter);
app.use('/diagnostique', diagnostiqueRouter);
app.use('/actions', actionsRouter);
app.use('/seance', seanceRouter);
app.use('/enum', enumRouter);
app.use('/reevaluation', reevaluationRouter);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: createError.HttpError, req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});


app.listen(3000, () => {
  console.log('Server running on port 3000');
  console.log('Images directory serving at /uploads');
})

export default app;