import { getStytchAuthHeaders } from '../lib/stytch';

/**
 * Generic integration POST. Server returns { mode: 'live'|'mock', ...payload }.
 * Returns parsed JSON on 2xx; throws on error with .userMessage.
 */
const postIntegration = async (path, body = {}) => {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getStytchAuthHeaders() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `${path} failed (${res.status})`);
    err.status = res.status;
    err.userMessage = data?.error?.message;
    throw err;
  }
  return data;
};

export const muxRequestUploadUrl = () =>
  postIntegration('/api/integrations/mux/upload-url');

export const stripeConnectOnboard = (params = {}) =>
  postIntegration('/api/integrations/stripe/connect/onboard', params);

export const docusignSendEnvelope = (params) =>
  postIntegration('/api/integrations/docusign/envelope', params);

export const plaidCreateLinkToken = () =>
  postIntegration('/api/integrations/plaid/link-token');

export const twilioSendSms = ({ to, message }) =>
  postIntegration('/api/integrations/twilio/sms', { to, message });

/**
 * Upload a File/Blob to Mux via the returned upload_url.
 * Server first calls muxRequestUploadUrl(); client then PUTs the file body.
 */
export const uploadVideoToMux = async (file, onProgress) => {
  const { mode, upload_url, upload_id, message } = await muxRequestUploadUrl();
  if (mode === 'mock' || !upload_url) {
    throw new Error(message || 'Mux not configured.');
  }
  // Use XHR for upload progress (fetch lacks PUT progress events natively)
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', upload_url, true);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300
      ? resolve()
      : reject(new Error(`Mux upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error('Mux upload network error'));
    xhr.send(file);
  });
  return { upload_id, mode };
};
