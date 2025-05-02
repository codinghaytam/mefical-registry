import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// view engine setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
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
// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});
// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
app.listen(3000);
export default app;
