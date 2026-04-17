export const formatNumber = (num) => {
  if (typeof num === 'string') return num;
  return num.toLocaleString();
};

export const formatCurrency = (num) => {
  if (typeof num === 'string') return num;
  return '$' + num.toLocaleString();
};

export const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // not a valid ISO string — return as-is
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60)   return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)   return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)     return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)       return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5)      return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12)    return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
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