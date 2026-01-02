
import sequelize from "../config/sequelize.js";
import * as url from 'url';
import * as path from 'path';


import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';

import * as crypto from 'node:crypto';

import os from 'os';
import moment from 'moment-timezone';
import ejs from "ejs";

import { Op, col ,Sequelize, fn ,literal ,Transaction  } from 'sequelize';
import jwt from 'jsonwebtoken';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

//=========== Common Import ================
import { addClientService } from '../helper/commonService.js';

//========================= END Import =========================================


function readBodyOrQuery(req) {
  return req.method === 'GET' ? req.query : req.body;
}

// self-registration => always guest
// function deriveActorApi() {
//   return { actorType: 'guest', actorId: null };
// }


function deriveActor(req) {
  const client = req.client || {};

  const actorType = client.type
    ? (client.type === 'Business' ? 'Business Client' : 'Individual Client')
    : 'Guest';

  return {
    actorType,
    actorId: client.client_account_id ?? null,
    actorEmail: client.email || null,
  };
}


export const checkHealth = async (req, res) => {
  try {
    res.status(200).send('Application is up and running');
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).send('Health check failed');
  }
};



export const add_client = async (req, res) => {

  const actorType = 'Guest'
  const actorId = null

  const result = await addClientService({
    body: readBodyOrQuery(req),
    file: req.file || null,         // usually null for API
    url: req.originalUrl,
    actorType,
    actorId,
  });

  if (!result.ok) {
    return res.status(result.code || 400).json({
      success: false,
      code: result.code,
      message: result.message,
      type: result.errorType,
      details: result.details || undefined,
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Client created',
    client_account_id: result.client.client_account_id,
    client_id: result.client.client_account_id,
  });
};






