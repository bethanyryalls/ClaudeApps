export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function scheduleNotification(post, minutesBefore = 60) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;

  const [year, month, day] = post.scheduledDate.split('-').map(Number);
  const [hour, minute] = post.scheduledTime.split(':').map(Number);
  const postTime = new Date(year, month - 1, day, hour, minute);
  const notifyTime = new Date(postTime.getTime() - minutesBefore * 60 * 1000);
  const now = new Date();
  const delay = notifyTime.getTime() - now.getTime();

  if (delay <= 0) return null;

  const timerId = setTimeout(() => {
    new Notification(`Time to post: ${post.title}`, {
      body: `${post.contentType} on ${post.platform} — scheduled for ${post.scheduledTime}\n\nShot list progress: ${post.shotList.filter(s => s.completed).length}/${post.shotList.length} shots done`,
      icon: '/icon.svg',
      tag: post.id,
    });
  }, delay);

  return timerId;
}

export function scheduleRecordingReminder(post, daysBefore = 1) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;

  const [year, month, day] = post.scheduledDate.split('-').map(Number);
  const postDate = new Date(year, month - 1, day, 9, 0);
  const remindDate = new Date(postDate);
  remindDate.setDate(remindDate.getDate() - daysBefore);
  const now = new Date();
  const delay = remindDate.getTime() - now.getTime();

  if (delay <= 0) return null;

  const timerId = setTimeout(() => {
    const pending = post.shotList.filter(s => !s.completed).length;
    new Notification(`Record tomorrow: ${post.title}`, {
      body: `You have ${pending} shot${pending !== 1 ? 's' : ''} left to capture for your ${post.platform} ${post.contentType}`,
      icon: '/icon.svg',
      tag: `remind_${post.id}`,
    });
  }, delay);

  return timerId;
}
