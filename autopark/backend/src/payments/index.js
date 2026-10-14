const mockProvider = require('./mockProvider');
const { PaymentError } = require('./provider');

// Adapters register here. Adding CMI later means writing cmiProvider.js and
// one line below — no controller changes.
const providers = {
  mock: mockProvider,
};

/**
 * The active adapter, chosen by PAYMENT_PROVIDER.
 *
 * Resolved per call rather than at import time so tests and scripts can flip
 * the variable without reloading the module graph.
 */
const getProvider = () => {
  const name = process.env.PAYMENT_PROVIDER || 'mock';
  const provider = providers[name];
  if (!provider) {
    throw new PaymentError(`Unknown payment provider "${name}"`, 500);
  }
  return provider;
};

module.exports = { getProvider, providers, PaymentError };
