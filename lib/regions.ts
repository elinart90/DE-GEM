export const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Western North', 'Central', 'Eastern',
  'Volta', 'Oti', 'Northern', 'Savannah', 'North East', 'Upper East', 'Upper West',
  'Bono', 'Bono East', 'Ahafo',
] as const

// Mirror of the server-side delivery fee logic, for display on the checkout form.
export function deliveryFeeFor(region: string, settings: Record<string, string>): number {
  if (!region) return 0
  const key = `delivery_fee_${region.toLowerCase().replace(/\s+/g, '_')}`
  return parseFloat(settings[key] ?? settings['delivery_fee_default'] ?? '0') || 0
}
