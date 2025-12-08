
import dotenv from 'dotenv';
dotenv.config();


const perfiosConfig = {
  
  credentials: {
    secureId: process.env.PERFIOS_SECURE_ID,
    secureCred: process.env.PERFIOS_SECURE_CRED,
    orgId: process.env.PERFIOS_ORG_ID,
  },

  apiEndpoints: {
    // DigiLocker endpoints
    digilockerLink: `${process.env.PERFIOS_API_BASE_URL}/ssp/digilocker/api/v3/digilocker/link`,
    digilockerDocuments: `${process.env.PERFIOS_API_BASE_URL}/ssp/digilocker/api/v3/digilocker/documents`,
    digilockerDownload: `${process.env.PERFIOS_API_BASE_URL}/ssp/digilocker/api/v3/digilocker/download`,
  },


  digilocker: {
    redirectUrl: process.env.DIGILOCKER_REDIRECT_URL,
    customDocList: process.env.DIGILOCKER_CUSTOM_DOC_LIST || 'ADHAR,PANCR',
    sessionExpiryMinutes: parseInt(process.env.DIGILOCKER_SESSION_EXPIRY_MINUTES || '30'),
  },

  frontend: {
    successUrl: process.env.FRONTEND_KYC_SUCCESS_URL,
    errorUrl: process.env.FRONTEND_KYC_ERROR_URL,
  },

  
  timeout: parseInt(process.env.PERFIOS_TIMEOUT || '180000'),

  
  headers: {
    'Content-Type': 'application/json',
  },
};

export const createPerfiosHeaders = () => ({
  'Content-Type': 'application/json',
  'x-secure-id': perfiosConfig.credentials.secureId,
  'x-secure-cred': perfiosConfig.credentials.secureCred,
  'x-organization-ID': perfiosConfig.credentials.orgId,
});


export const validatePerfiosConfig = () => {
  const required = [
    'PERFIOS_SECURE_ID',
    'PERFIOS_SECURE_CRED',
    'PERFIOS_ORG_ID',
    'PERFIOS_API_BASE_URL',
    'DIGILOCKER_REDIRECT_URL',
    'FRONTEND_KYC_SUCCESS_URL',
    'FRONTEND_KYC_ERROR_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Perfios configuration: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
};

export default perfiosConfig;
