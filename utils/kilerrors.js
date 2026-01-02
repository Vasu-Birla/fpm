// utils/formatSequelizeError.js
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError
} from 'sequelize';

export const kilerrors = (error) => {
  // Handle Sequelize errors
  if (error instanceof UniqueConstraintError) {
    const msg = error.errors.map(e => `'${e.value}' already exists for ${e.path}`).join(', ');
    return `Duplicate value: ${msg}`;
  }

  if (error instanceof ValidationError) {
    const msg = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
    return `Validation failed: ${msg}`;
  }

  if (error instanceof ForeignKeyConstraintError) {
    return `Foreign key constraint error on field '${error.index}'`;
  }

  if (error.original?.sqlMessage) {
    return `SQL Error: ${error.original.sqlMessage}`;
  }

  // Handle common Node.js errors
  if (error instanceof ReferenceError) {
    return `Reference Error: ${error.message}`;
  }

  if (error instanceof TypeError) {
    return `Type Error: ${error.message}`;
  }

  if (error instanceof SyntaxError) {
    return `Syntax Error: ${error.message}`;
  }

  // Fallback for any other error
  return error.message || 'Unexpected server error';
};


export function fullErrorString(err){ return String(err?.stack || err?.message || err); }