/**
 * Opt-in pagination that keeps every response a plain array.
 *
 * Existing clients never send page/limit and keep getting the array they
 * always got — capped at SAFETY_CAP so no list endpoint is unbounded any more.
 * A client that sends ?page=&limit= gets that page; either way the total is
 * in X-Total-Count (and page metadata in X-Page / X-Limit / X-Pages), so the
 * body shape never changes.
 */
const SAFETY_CAP = 1000;
const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

const paging = (req) => {
  const wants = req.query.page !== undefined || req.query.limit !== undefined;
  if (!wants) return { wants, page: 1, limit: SAFETY_CAP, skip: 0 };
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  return { wants, page, limit, skip: (page - 1) * limit };
};

/**
 * @param shape adds sort/populate/select/lean to the query, e.g.
 *   (q) => q.sort({ createdAt: -1 }).populate('userId', 'fullName')
 */
const paginate = async (req, res, model, filter = {}, shape = (q) => q) => {
  const p = paging(req);
  const [total, items] = await Promise.all([
    model.countDocuments(filter),
    shape(model.find(filter)).skip(p.skip).limit(p.limit),
  ]);
  res.set('X-Total-Count', String(total));
  if (p.wants) {
    res.set({
      'X-Page': String(p.page),
      'X-Limit': String(p.limit),
      'X-Pages': String(Math.max(1, Math.ceil(total / p.limit))),
    });
  }
  return items;
};

module.exports = { paginate, paging, SAFETY_CAP, MAX_PAGE_SIZE };
