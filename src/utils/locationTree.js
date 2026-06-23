/**
 * buildLocationTree
 * Builds a nested { state: { city: [hubs] } } tree from a flat hub array.
 * Used in HubPickerFlow to render the state → city → hub selection flow.
 */
export function buildLocationTree(hubs) {
  const tree = {};
  (hubs || []).forEach(h => {
    const state = h.state || 'Other';
    const city  = h.city  || 'Other';
    if (!tree[state])       tree[state] = {};
    if (!tree[state][city]) tree[state][city] = [];
    tree[state][city].push(h);
  });
  return tree;
}
