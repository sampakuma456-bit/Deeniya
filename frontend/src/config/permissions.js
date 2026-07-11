const ACTIONS = ['view', 'create', 'edit', 'delete'];

const PERMISSION_GROUPS = [
  {
    label: 'Dashboard',
    modules: [
      { key: 'dashboard', label: 'Dashboard Overview', actions: ['view'] }
    ]
  },
  {
    label: 'Master Files',
    modules: [
      { key: 'master-supplier', label: 'Supplier Master', actions: ['view', 'edit', 'delete'] },
      { key: 'master-item', label: 'Item Master', actions: ['view', 'edit', 'delete'] },
      { key: 'master-donor', label: 'Donor Master', actions: ['view', 'edit', 'delete'] },
      { key: 'master-expenses', label: 'Expenses (Account) Master', actions: ['view', 'edit', 'delete'] },
      { key: 'master-category', label: 'Category Master', actions: ['view', 'edit', 'delete'] },
      { key: 'master-route', label: 'Route Master', actions: ['view', 'edit', 'delete'] },
      { key: 'master-location', label: 'Location Master', actions: ['view', 'edit', 'delete'] },
      { key: 'master-bank', label: 'Bank Master', actions: ['view', 'edit', 'delete'] },
      { key: 'master-company', label: 'Company Master', actions: ['view', 'edit', 'delete'] }
    ]
  },
  {
    label: 'Transactions',
    modules: [
      { key: 'transaction-donor-receipt', label: 'Donor Receipt', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'transaction-general-receipt', label: 'General Receipt', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'transaction-general-payment', label: 'General Payment', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'transaction-general-journal', label: 'General Journal', actions: ['view', 'create', 'edit', 'delete'] }
    ]
  },
  {
    label: 'Inventory',
    modules: [
      { key: 'inventory-purchase', label: 'Item Purchases', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'inventory-gin', label: 'Goods Issue Note', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'inventory-payment', label: 'Supplier Payment', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'inventory-till', label: 'Till Issue & Collect', actions: ['view', 'create', 'edit', 'delete'] }
    ]
  },
  {
    label: 'General Reports',
    modules: [
      { key: 'report-day-book', label: 'Day Book', actions: ['view'] },
      { key: 'report-statement', label: 'Statement Report', actions: ['view'] },
      { key: 'report-donor-receipt-tx', label: 'Donor Receipt Transaction', actions: ['view'] },
      { key: 'report-general-receipt-tx', label: 'General Receipt Transaction', actions: ['view'] },
      { key: 'report-general-payment-tx', label: 'General Payment Transaction', actions: ['view'] },
      { key: 'report-journal-tx', label: 'Journal Transaction', actions: ['view'] }
    ]
  },
  {
    label: 'Purchase Reports',
    modules: [
      { key: 'report-shop-outstanding', label: 'Shop Outstanding Report', actions: ['view'] },
      { key: 'report-item-report', label: 'Item Report', actions: ['view'] },
      { key: 'report-item-stock', label: 'Item Stock Report', actions: ['view'] },
      { key: 'report-till-report', label: 'Till Report', actions: ['view'] }
    ]
  },
  {
    label: 'Account Reports',
    modules: [
      { key: 'report-income-statement', label: 'Income Statement', actions: ['view'] },
      { key: 'report-p-and-l', label: 'P & L', actions: ['view'] },
      { key: 'report-whatsapp', label: 'WhatsApp Send Report', actions: ['view'] },
      { key: 'report-pd-cheque', label: 'PD Cheque Report', actions: ['view'] }
    ]
  },
  {
    label: 'Donor Reports',
    modules: [
      { key: 'report-all-statement', label: 'All Donor Statement', actions: ['view'] },
      { key: 'report-route-wise', label: 'Route Wise Donor Report', actions: ['view'] },
      { key: 'report-category-wise', label: 'Category Wise Donor Report', actions: ['view'] },
      { key: 'report-donor-statement', label: 'Donor Statement', actions: ['view'] }
    ]
  },
  {
    label: 'Log Reports',
    modules: [
      { key: 'report-user-activity', label: 'User Activity Report', actions: ['view'] },
      { key: 'report-user-log', label: 'User Log Report', actions: ['view'] }
    ]
  },
  {
    label: 'System',
    modules: [
      { key: 'user-management', label: 'User Management', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'settings', label: 'Settings', actions: ['view', 'edit'] }
    ]
  }
];

const permKey = (moduleKey, action) => `${moduleKey}:${action}`;

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g =>
  g.modules.flatMap(m => m.actions.map(a => permKey(m.key, a)))
);

export const getPermissionLabel = (fullKey) => {
  const [moduleKey, action] = fullKey.split(':');
  for (const group of PERMISSION_GROUPS) {
    const mod = group.modules.find(m => m.key === moduleKey);
    if (mod) return `${mod.label} - ${action.charAt(0).toUpperCase() + action.slice(1)}`;
  }
  return fullKey;
};

export const getModuleLabel = (moduleKey) => {
  for (const group of PERMISSION_GROUPS) {
    const mod = group.modules.find(m => m.key === moduleKey);
    if (mod) return mod.label;
  }
  return moduleKey;
};

export const actionLabels = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete'
};

export const DONOR_ALLOWED_MODULES = [
  'dashboard',
  'master-supplier', 'master-item', 'master-donor', 'master-expenses',
  'master-category', 'master-route', 'master-location', 'master-bank', 'master-company',
  'transaction-donor-receipt', 'transaction-general-receipt',
  'transaction-general-payment', 'transaction-general-journal',
  'inventory-purchase', 'inventory-gin', 'inventory-payment', 'inventory-till',
  'report-day-book',
  'report-item-report',
  'report-till-report',
  'report-donor-statement'
];

export const getDonorPermissions = () =>
  PERMISSION_GROUPS.flatMap(g =>
    g.modules.flatMap(m =>
      DONOR_ALLOWED_MODULES.includes(m.key)
        ? m.actions.map(a => `${m.key}:${a}`)
        : []
    )
  );

export default PERMISSION_GROUPS;
