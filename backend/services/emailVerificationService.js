import { Api } from 'zerobounce';
import logger from '../config/logger.js';

const apiKey = process.env.ZEROBOUNCE_API_KEY;
let client = null;

if (apiKey) {
  client = new Api(apiKey);
  logger.info('[ZeroBounce] Client initialized');
} else {
  logger.warn(
    '[ZeroBounce] ZEROBOUNCE_API_KEY not set — email verification via ZeroBounce disabled. ' +
    'Set ZEROBOUNCE_API_KEY in your environment to enable inbox-level email validation.'
  );
}

export async function verifyEmailWithZeroBounce(email) {
  if (!client) {
    return {
      status: 'unknown',
      reason: 'ZeroBounce not configured. Set ZEROBOUNCE_API_KEY in your environment.',
    };
  }

  try {
    const response = await client.validate(email);

    if (response.error) {
      logger.error('[ZeroBounce] API error:', response.error);
      return { status: 'unknown', reason: response.error.error || 'API error' };
    }

    const result = response.success;

    return {
      status: result.status,
      sub_status: result.subStatus,
      free_email: result.freeEmail,
      did_you_mean: result.didYouMean,
      mx_found: result.mxFound,
      domain: result.domain,
    };
  } catch (err) {
    logger.error('[ZeroBounce] Verification error:', err);
    return { status: 'unknown', reason: err.message };
  }
}

export async function checkCredits() {
  if (!client) return null;
  try {
    const response = await client.getCredits();
    if (response.success) {
      return response.success.credits;
    }
    return null;
  } catch (err) {
    logger.error('[ZeroBounce] Credit check error:', err);
    return null;
  }
}
