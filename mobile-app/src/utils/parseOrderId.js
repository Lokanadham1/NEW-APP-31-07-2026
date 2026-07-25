// Every order-related notification message includes "Order #<id>" (see the
// notify() call sites in backend/server.js). Used to make tapping a
// notification jump straight to that order instead of just marking it read.
export function parseOrderId(message) {
  const match = /Order #(\d+)/.exec(message || '');
  return match ? Number(match[1]) : null;
}
