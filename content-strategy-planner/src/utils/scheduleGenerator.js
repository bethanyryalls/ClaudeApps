import { PLATFORMS, SHOT_LIST_TEMPLATES } from '../data/strategies.js';

let idCounter = 0;
function genId() {
  return `post_${Date.now()}_${++idCounter}`;
}

function genShotId() {
  return `shot_${Date.now()}_${++idCounter}`;
}

function getShotList(contentType, niche) {
  const templates = SHOT_LIST_TEMPLATES[contentType];
  if (!templates) return getDefaultShotList();
  const list = templates[niche] || templates.default;
  if (!list) return getDefaultShotList();
  return list.map(item => ({
    id: genShotId(),
    description: item.description,
    tip: item.tip || null,
    completed: false,
  }));
}

function getDefaultShotList() {
  return [
    { id: genShotId(), description: 'Hook / opening shot', tip: 'First 2 seconds must grab attention', completed: false },
    { id: genShotId(), description: 'Main content delivery', tip: null, completed: false },
    { id: genShotId(), description: 'B-roll / supporting footage', tip: null, completed: false },
    { id: genShotId(), description: 'Call to action / outro', tip: null, completed: false },
  ];
}

function pickContentType(platform, weekIndex) {
  const mix = PLATFORMS[platform].contentMix;
  const types = Object.keys(mix);
  const weights = types.map(t => mix[t]);
  // Use week index to cycle through content types deterministically
  const cumulative = [];
  weights.reduce((acc, w, i) => { cumulative[i] = acc + w; return cumulative[i]; }, 0);
  const r = (weekIndex * 0.137 + 0.05) % 1;
  for (let i = 0; i < cumulative.length; i++) {
    if (r < cumulative[i]) return types[i];
  }
  return types[0];
}

function getTimeSlot(platform, slotIndex) {
  const times = PLATFORMS[platform].bestTimes;
  return times[slotIndex % times.length];
}

export function generateSchedule(profile, weeksAhead = 4) {
  const posts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = weeksAhead * 7;

  for (const platform of profile.platforms) {
    const pData = PLATFORMS[platform];
    const postsPerWeek = profile.frequency[platform] || 3;

    let postCount = 0;
    let slotIndex = 0;

    for (let day = 0; day < totalDays; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + day);
      const dayOfWeek = date.getDay();

      if (!pData.bestDays.includes(dayOfWeek)) continue;

      // How many posts on this day for this platform
      const postsPerDay = postsPerWeek <= 7 ? (dayOfWeek % 2 === 0 ? 1 : (postsPerWeek >= 5 ? 1 : 0)) : Math.ceil(postsPerWeek / 7);

      for (let p = 0; p < postsPerDay; p++) {
        if (postCount >= postsPerWeek * weeksAhead) break;
        const weekIndex = Math.floor(day / 7);
        const contentType = pickContentType(platform, weekIndex * 10 + postCount);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = getTimeSlot(platform, slotIndex);

        posts.push({
          id: genId(),
          platform,
          contentType,
          title: generateTitle(platform, contentType, profile.niche, postCount),
          scheduledDate: dateStr,
          scheduledTime: timeStr,
          status: 'planned',
          shotList: getShotList(contentType, profile.niche),
          batchGroup: assignBatchGroup(contentType),
          notes: '',
          reminderSet: false,
        });

        postCount++;
        slotIndex++;
      }
    }
  }

  // Sort by date then time
  posts.sort((a, b) => {
    const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
    return dateCompare !== 0 ? dateCompare : a.scheduledTime.localeCompare(b.scheduledTime);
  });

  return posts;
}

function generateTitle(platform, contentType, niche, index) {
  const titles = {
    fitness: [
      'Full Body Workout', 'Meal Prep Sunday', 'Morning Routine', '10-Min HIIT', 'Gym Motivation',
      'Healthy Snack Ideas', 'Progress Update', 'Beginner Workout', 'Nutrition Tips', 'Rest Day Vlog',
    ],
    tech: [
      'Product Review', 'Setup Tour', 'App of the Week', 'Tech Unboxing', 'Productivity Hack',
      'Best Budget Tech', 'New Release First Look', 'Tutorial', 'Tech News Roundup', 'Comparison Video',
    ],
    lifestyle: [
      'Day in My Life', 'Morning Routine', 'Room Makeover', 'Haul Video', 'Weekly Reset',
      'What I Eat in a Day', 'Productive Day', 'Evening Routine', 'Apartment Tour', 'Weekly Vlog',
    ],
    food: [
      'Quick Recipe', 'Meal Prep for the Week', 'Restaurant Review', '5-Ingredient Dinner', 'Breakfast Ideas',
      'Healthy Snack', 'Baking Tutorial', 'Budget Meals', 'Kitchen Hack', 'Street Food Tour',
    ],
    travel: [
      'City Guide', 'Packing Tips', 'Hidden Gems', 'Travel Day Vlog', 'Hotel Review',
      'Budget Travel Tips', 'Itinerary Breakdown', 'Local Food Guide', 'Travel Essentials', 'Day Trip',
    ],
    beauty: [
      'Get Ready With Me', 'Skincare Routine', 'OOTD', 'Makeup Tutorial', 'Product Review',
      'Drugstore Finds', 'Seasonal Trends', 'Hair Routine', 'Unboxing Haul', 'Morning Glam',
    ],
    business: [
      'Day in My Life', 'Income Update', 'Business Tip', 'Tool Review', 'Productivity System',
      'Passive Income Ideas', 'Mindset Talk', 'Week in Business', 'Investing Basics', 'Entrepreneur Story',
    ],
    education: [
      'Topic Explained Simply', 'Myth Busted', 'Book Summary', 'Study With Me', 'Quick Fact',
      'Concept Deep Dive', 'History Lesson', 'Science Explained', 'How It Works', 'Skill Tutorial',
    ],
    gaming: [
      'First Look', 'Tips for Beginners', 'Epic Moments', 'Game Review', 'Setup Tour',
      'Rank Grind', 'Hidden Easter Egg', 'Best Builds', 'Gaming News', 'Speed Run Attempt',
    ],
  };

  const list = titles[niche] || titles.lifestyle;
  const base = list[index % list.length];
  const typePrefix = {
    Carousel: '📊 ',
    'YouTube Short': '⚡ ',
    Thread: '🧵 ',
    Article: '📝 ',
    'Idea Pin': '💡 ',
  };
  return (typePrefix[contentType] || '') + base;
}

function assignBatchGroup(contentType) {
  const groups = {
    'Reel': 'talking-head',
    'Short (<30s)': 'talking-head',
    'YouTube Short': 'talking-head',
    'Long-form Video': 'long-form',
    'Tutorial': 'long-form',
    'Carousel': 'design-session',
    'Static Post': 'design-session',
    'Standard Pin': 'design-session',
    'Idea Pin': 'design-session',
    'Text Post': 'writing-session',
    'Tweet': 'writing-session',
    'Thread': 'writing-session',
    'Article': 'writing-session',
    'Story': 'daily-capture',
    'Live Stream': 'live',
  };
  return groups[contentType] || 'general';
}

export function getPostsByDate(posts, dateStr) {
  return posts.filter(p => p.scheduledDate === dateStr);
}

export function getUpcomingPosts(posts, days = 7) {
  const today = new Date().toISOString().split('T')[0];
  const future = new Date();
  future.setDate(future.getDate() + days);
  const futureStr = future.toISOString().split('T')[0];
  return posts.filter(p => p.scheduledDate >= today && p.scheduledDate <= futureStr);
}

export function getBatchGroups(posts) {
  const groups = {};
  posts.forEach(post => {
    if (post.status !== 'planned' && post.status !== 'shot_ready') return;
    const g = post.batchGroup || 'general';
    if (!groups[g]) groups[g] = [];
    groups[g].push(post);
  });
  return groups;
}

export const BATCH_GROUP_LABELS = {
  'talking-head': { label: 'Talking Head Session', icon: '🎤', color: '#6750A4' },
  'long-form': { label: 'Full Production Day', icon: '🎬', color: '#E64A19' },
  'design-session': { label: 'Design & Graphics Session', icon: '🎨', color: '#0288D1' },
  'writing-session': { label: 'Writing Session', icon: '✍️', color: '#388E3C' },
  'daily-capture': { label: 'Daily Capture', icon: '📱', color: '#FFA000' },
  'live': { label: 'Live Session', icon: '🔴', color: '#C62828' },
  'general': { label: 'General Shoot', icon: '📷', color: '#546E7A' },
};
