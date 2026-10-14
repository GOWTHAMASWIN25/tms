export const colors = {
  ink: '#18243A',
  muted: '#748198',
  background: '#F4F7FB',
  surface: '#FFFFFF',
  primary: '#176B58',
  primaryLight: '#E6F4EF',
  line: '#E6EAF0',
  danger: '#C94848',
  warning: '#B7791F',
  blue: '#3973B9',
  purple: '#7253B7',
};

export const statusColor = (status) => {
  if (status === 'Closed') return colors.primary;
  if (status === 'In-Progress') return colors.blue;
  if (status === 'Assigned') return colors.purple;
  if (status === 'Onhold') return colors.warning;
  return colors.warning;
};
