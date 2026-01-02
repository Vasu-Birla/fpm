import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} from 'sequelize';

const errorHandler = (err, req, res, next) => {
  console.error('Global Error:', err);

  let message = 'Something went wrong.';

  if (err instanceof UniqueConstraintError) {
    message = err.errors
      .map((e) => `Duplicate entry for '${e.path}': '${e.value}'`)
      .join(', ');
  } else if (err instanceof ValidationError) {
    message = err.errors.map((e) => e.message).join(', ');
  } else if (err instanceof ForeignKeyConstraintError) {
    message = 'Foreign key constraint failed.';
  } else if (err.message) {
    message = err.message;
  }

  // Render dynamic error in your EJS view
  return res.status(500).render('superadmin/error500', {
    output: message,
  });
};

export default errorHandler;
