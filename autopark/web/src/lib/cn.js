// Tiny class-name joiner. Accepts strings, arrays and falsey values so
// conditional classes read as `cn('base', isOpen && 'open')`.
export const cn = (...parts) => parts.flat(Infinity).filter(Boolean).join(' ');

export default cn;
