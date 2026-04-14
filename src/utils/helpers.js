export const formatNumber = (num) => {
  if (typeof num === 'string') return num;
  return num.toLocaleString();
};

export const formatCurrency = (num) => {
  if (typeof num === 'string') return num;
  return '$' + num.toLocaleString();
};

export const timeAgo = (dateString) => {
  return dateString;
};

export const truncate = (str, len = 50) => {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
};

export const getVerticalColor = (vertical) => {
  const colors = {
    film: 'blue-500',
    music: 'amber-500',
    composer: 'emerald-500',
    community: 'purple-500',
    strategy: 'rose-500'
  };
  return colors[vertical] || 'zinc-500';
};

export const getVerticalBgColor = (vertical) => {
  const colors = {
    film: 'bg-blue-500',
    music: 'bg-amber-500',
    composer: 'bg-emerald-500',
    community: 'bg-purple-500',
    strategy: 'bg-rose-500'
  };
  return colors[vertical] || 'bg-zinc-500';
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};