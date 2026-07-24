// Single source of truth for order-status labels/colors/ordering, shared by
// StatusPill, the customer Order Status timeline, and every admin order
// screen — so the pipeline only has to be defined once.
import { colors } from './colors';

export const STATUS_LABEL = {
  pending: 'Pending Approval',
  approved: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  completed: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const STATUS_COLOR = {
  pending: colors.goldDark,
  approved: colors.primary,
  preparing: colors.primary,
  ready: colors.primary,
  out_for_delivery: colors.primary,
  completed: colors.primaryDark,
  rejected: colors.danger,
  cancelled: colors.slate,
};

// The "happy path" pipeline in order, for rendering a step-by-step timeline.
// out_for_delivery is the one optional step (spec: "if applicable") — still
// shown in the timeline, just not required before delivery.
export const PIPELINE = ['pending', 'approved', 'preparing', 'ready', 'out_for_delivery', 'completed'];
