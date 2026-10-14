/**
 * The contract every payment adapter implements.
 *
 * Keeping the controller behind this interface is what makes swapping the
 * mock for CMI (or Stripe) a one-file change: nothing above this layer knows
 * what a gateway session looks like.
 *
 * @typedef {object} Charge
 * @property {string} ref           Provider-side identifier.
 * @property {'pending'|'paid'|'failed'|'refunded'} status
 * @property {string} [redirectUrl] Where to send the payer, for 3-D Secure flows.
 * @property {string} [failureReason]
 *
 * @typedef {object} PaymentProvider
 * @property {string} name
 * @property {(input: {amount:number, currency:string, description:string,
 *            metadata:object}) => Promise<Charge>} createCharge
 * @property {(ref: string, input?: {outcome?: 'success'|'failure'}) =>
 *            Promise<Charge>} confirmCharge
 * @property {(ref: string, amount: number) => Promise<Charge>} refundCharge
 */

/** Thrown for anything the caller did wrong, so controllers can answer 400. */
class PaymentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'PaymentError';
    this.status = status;
  }
}

module.exports = { PaymentError };
