/* =========================================================
   Amazon-themed portfolio · interactivity
   ========================================================= */

/* ---------- Footer year ---------- */
const yearNode = document.getElementById('year');
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

/* ---------- Cart count (counts featured projects) ---------- */
const cartCountNode = document.getElementById('az-cart-count');
const productCards = document.querySelectorAll('.az-product');

function updateCart(count) {
  if (cartCountNode) cartCountNode.textContent = String(count);
}

let cartCount = productCards.length;
updateCart(cartCount);

document.querySelectorAll('.az-add-cart').forEach((btn) => {
  btn.addEventListener('click', () => {
    cartCount += 1;
    updateCart(cartCount);
    const original = btn.textContent;
    btn.textContent = 'Added ✓';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1400);
  });
});

/* ---------- Search bar (filters projects, skills, experience by keyword) ---------- */
const searchForm = document.getElementById('az-search');
if (searchForm) {
  const input = searchForm.querySelector('.az-search-input');
  const category = searchForm.querySelector('.az-search-cat');

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const term = (input.value || '').trim().toLowerCase();
    const cat = category.value;

    const targets = document.querySelectorAll('[data-search]');

    if (!term && cat === 'all') {
      targets.forEach((el) => el.classList.remove('az-hidden', 'az-flash'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let firstMatch = null;
    targets.forEach((el) => {
      const haystack = el.dataset.search || '';
      const matchesTerm = !term || haystack.includes(term);
      const matchesCat = cat === 'all' || haystack.includes(cat);

      if (matchesTerm && matchesCat) {
        el.classList.remove('az-hidden');
        if (!firstMatch) firstMatch = el;
      } else {
        el.classList.add('az-hidden');
      }
    });

    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstMatch.classList.add('az-flash');
      setTimeout(() => firstMatch.classList.remove('az-flash'), 1600);
    } else {
      const banner = document.querySelector('.az-hero-card h1');
      if (banner) {
        const original = banner.textContent;
        banner.textContent = `No results for "${term}" — but I’m sure I can build it!`;
        setTimeout(() => {
          banner.textContent = original;
        }, 3000);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  /* clearing input restores everything */
  input.addEventListener('search', () => {
    if (!input.value) {
      document.querySelectorAll('[data-search]').forEach((el) => {
        el.classList.remove('az-hidden', 'az-flash');
      });
    }
  });
}

/* ---------- Skill carousel arrows ---------- */
const skillTrack = document.getElementById('az-skill-track');
const skillArrowLeft = document.getElementById('az-skill-arrow-left');
const skillArrowRight = document.getElementById('az-skill-arrow-right');

if (skillTrack && skillArrowLeft && skillArrowRight) {
  function scrollSkillTrack(direction) {
    const step = Math.max(skillTrack.clientWidth * 0.8, 200);
    skillTrack.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  function updateSkillArrows() {
    const maxScroll = skillTrack.scrollWidth - skillTrack.clientWidth - 1;
    skillArrowLeft.disabled = skillTrack.scrollLeft <= 0;
    skillArrowRight.disabled = skillTrack.scrollLeft >= maxScroll;
  }

  skillArrowLeft.addEventListener('click', () => scrollSkillTrack(-1));
  skillArrowRight.addEventListener('click', () => scrollSkillTrack(1));
  skillTrack.addEventListener('scroll', updateSkillArrows, { passive: true });
  window.addEventListener('resize', updateSkillArrows);
  updateSkillArrows();
}

/* ---------- "All" hamburger jumps to first section ---------- */
const hamburger = document.getElementById('az-hamburger');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    const about = document.getElementById('about');
    if (about) about.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ---------- Hero image periodic flip ---------- */
const heroFlip = document.getElementById('az-hero-flip');
if (heroFlip) {
  const FLIP_INTERVAL_MS = 5000;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timerId = null;
  let paused = false;

  function flip() {
    heroFlip.classList.toggle('is-flipped');
  }

  function start() {
    if (prefersReducedMotion || paused || timerId) return;
    timerId = setInterval(flip, FLIP_INTERVAL_MS);
  }

  function stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  /* Pause on hover/focus so users can read the back face. */
  heroFlip.addEventListener('mouseenter', () => {
    paused = true;
    stop();
  });
  heroFlip.addEventListener('mouseleave', () => {
    paused = false;
    start();
  });

  /* Click to flip manually (useful on touch devices). */
  heroFlip.addEventListener('click', () => {
    flip();
    stop();
    if (!paused) start();
  });

  /* Pause when the tab isn't visible to save cycles. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  start();
}

/* =========================================================
   Live data: GitHub + LeetCode
   ========================================================= */
const activitySection = document.getElementById('activity');
const githubList = document.getElementById('github-activity');
const leetcodeStats = document.getElementById('leetcode-stats');
const leetcodeProfileLink = document.getElementById('leetcode-profile-link');
const leetcodeRecentAc = document.getElementById('leetcode-recent-ac');
const leetcodeSubmissionsLink = document.getElementById('leetcode-submissions-link');

/* Preview cards in the "Customer Reviews · Activity" tile up top. */
const previewGithub = document.getElementById('preview-github');
const previewLeetcode = document.getElementById('preview-leetcode');

const githubUsername = activitySection?.dataset.githubUsername?.trim() || '';
const leetcodeUsername = activitySection?.dataset.leetcodeUsername?.trim() || '';

/* Public proxy for LeetCode's GraphQL endpoint (CORS-enabled). */
const LEETCODE_API = 'https://alfa-leetcode-api.onrender.com';

/* ---------- Preview tile helpers ---------- */
function renderPreview(container, { title, meta, href }) {
  if (!container) return;
  const titleEl = container.querySelector('.az-preview-title');
  const metaEl = container.querySelector('.az-preview-meta');
  if (titleEl) titleEl.textContent = title;
  if (metaEl) metaEl.textContent = meta || '';

  if (href) {
    if (container.tagName.toLowerCase() !== 'a') {
      const link = document.createElement('a');
      link.className = container.className + ' az-preview-link';
      link.id = container.id;
      link.href = href;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.innerHTML = container.innerHTML;
      container.replaceWith(link);
    } else {
      container.href = href;
    }
  }
}

function setPreviewError(container, message) {
  if (!container) return;
  const titleEl = container.querySelector('.az-preview-title');
  const metaEl = container.querySelector('.az-preview-meta');
  if (titleEl) titleEl.textContent = message;
  if (metaEl) metaEl.textContent = '';
}

const eventLabels = {
  PushEvent: 'Pushed commits',
  PullRequestEvent: 'Opened/updated a pull request',
  IssuesEvent: 'Worked on an issue',
  IssueCommentEvent: 'Commented on an issue',
  PullRequestReviewEvent: 'Reviewed a pull request',
  WatchEvent: 'Starred a repository',
  ForkEvent: 'Forked a repository',
  CreateEvent: 'Created a branch or repository',
};

function formatDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function createGithubItem(event) {
  const li = document.createElement('li');
  const title = document.createElement('strong');
  title.textContent = eventLabels[event.type] || event.type;

  const repo = document.createElement('p');
  repo.className = 'az-gh-repo';
  if (event.repo?.name) {
    const repoLink = document.createElement('a');
    repoLink.href = `https://github.com/${event.repo.name}`;
    repoLink.target = '_blank';
    repoLink.rel = 'noreferrer';
    repoLink.className = 'az-gh-repo-link';
    repoLink.textContent = event.repo.name;
    repo.append('Repo: ', repoLink);
  } else {
    repo.textContent = 'Repository not available';
  }

  const time = document.createElement('time');
  time.textContent = formatDate(event.created_at);

  li.append(title, repo, time);
  return li;
}

async function loadGithubActivity() {
  if (!githubList || !githubUsername) return;

  try {
    const response = await fetch(`https://api.github.com/users/${githubUsername}/events/public`);
    if (!response.ok) throw new Error('GitHub request failed');

    const events = await response.json();
    const recentEvents = Array.isArray(events) ? events.slice(0, 5) : [];

    githubList.innerHTML = '';

    if (recentEvents.length === 0) {
      githubList.innerHTML = '<li>No recent public events available.</li>';
      setPreviewError(previewGithub, 'No recent public events.');
      return;
    }

    recentEvents.forEach((event) => githubList.appendChild(createGithubItem(event)));

    const first = recentEvents[0];
    const action = eventLabels[first.type] || first.type;
    const repo = first.repo?.name || 'unknown repo';
    const when = first.created_at
      ? formatRelativeTime(Math.floor(new Date(first.created_at).getTime() / 1000))
      : '';
    renderPreview(previewGithub, {
      title: `${action} · ${repo}`,
      meta: when ? `${when} on GitHub` : 'On GitHub',
      href: first.repo?.name ? `https://github.com/${first.repo.name}` : `https://github.com/${githubUsername}`,
    });
  } catch {
    githubList.innerHTML = '<li>Unable to load GitHub activity right now.</li>';
    setPreviewError(previewGithub, 'Unable to load GitHub activity.');
  }
}

function renderLeetCodeStats(stats) {
  if (!leetcodeStats) return;

  const totalSolved = stats.totalSolved ?? '-';
  const easy = stats.easySolved ?? '-';
  const medium = stats.mediumSolved ?? '-';
  const hard = stats.hardSolved ?? '-';

  /* The proxy doesn't expose acceptance % directly; derive from
     matchedUserStats.acSubmissionNum (count / submissions for "All"). */
  let acceptanceRate = '-';
  const acAll = stats.matchedUserStats?.acSubmissionNum?.find?.((d) => d.difficulty === 'All');
  const allSubs = stats.totalSubmissions?.find?.((d) => d.difficulty === 'All');
  if (acAll && allSubs && allSubs.submissions > 0) {
    acceptanceRate = `${((acAll.submissions / allSubs.submissions) * 100).toFixed(1)}%`;
  }

  leetcodeStats.innerHTML = `
    <div class="stat-box">
      <span>Total Solved</span>
      <strong>${totalSolved}</strong>
    </div>
    <div class="stat-box">
      <span>Acceptance Rate</span>
      <strong>${acceptanceRate}</strong>
    </div>
    <div class="stat-box">
      <span>Easy Solved</span>
      <strong>${easy}</strong>
    </div>
    <div class="stat-box">
      <span>Medium Solved</span>
      <strong>${medium}</strong>
    </div>
    <div class="stat-box">
      <span>Hard Solved</span>
      <strong>${hard}</strong>
    </div>
  `;
}

/* ---------- Recent AC list (scraped from LeetCode profile) ---------- */
function formatRelativeTime(unixSeconds) {
  const seconds = Number(unixSeconds);
  if (!Number.isFinite(seconds)) return '';
  const diff = Math.max(0, Date.now() / 1000 - seconds);

  if (diff < 60) return 'just now';
  if (diff < 3600) {
    const m = Math.round(diff / 60);
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  if (diff < 86400) {
    const h = Math.round(diff / 3600);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  if (diff < 86400 * 30) {
    const d = Math.round(diff / 86400);
    return `${d} day${d === 1 ? '' : 's'} ago`;
  }
  if (diff < 86400 * 365) {
    const mo = Math.round(diff / (86400 * 30));
    return `${mo} month${mo === 1 ? '' : 's'} ago`;
  }
  const y = Math.round(diff / (86400 * 365));
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

function prettifyLang(lang) {
  if (!lang) return '';
  const map = {
    python3: 'Python 3',
    python: 'Python',
    cpp: 'C++',
    csharp: 'C#',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    java: 'Java',
    golang: 'Go',
    rust: 'Rust',
    kotlin: 'Kotlin',
    swift: 'Swift',
    ruby: 'Ruby',
    scala: 'Scala',
    mysql: 'MySQL',
  };
  return map[lang.toLowerCase()] || lang;
}

function createAcItem(sub) {
  const li = document.createElement('li');
  li.className = 'az-ac-item';

  const titleLink = document.createElement('a');
  titleLink.href = `https://leetcode.com/problems/${sub.titleSlug}/`;
  titleLink.target = '_blank';
  titleLink.rel = 'noreferrer';
  titleLink.className = 'az-ac-title';
  titleLink.textContent = sub.title;

  const meta = document.createElement('div');
  meta.className = 'az-ac-meta';

  const status = document.createElement('span');
  status.className = 'az-ac-status';
  status.textContent = sub.statusDisplay || 'Accepted';

  const lang = document.createElement('span');
  lang.className = 'az-ac-lang';
  lang.textContent = prettifyLang(sub.lang);

  const time = document.createElement('time');
  time.className = 'az-ac-time';
  time.textContent = formatRelativeTime(sub.timestamp);

  meta.append(status, lang, time);
  li.append(titleLink, meta);
  return li;
}

async function loadLeetCodeRecentAc() {
  if (!leetcodeRecentAc || !leetcodeUsername) return;

  if (leetcodeSubmissionsLink) {
    leetcodeSubmissionsLink.href = `https://leetcode.com/u/${leetcodeUsername}/`;
  }

  try {
    const response = await fetch(
      `${LEETCODE_API}/${encodeURIComponent(leetcodeUsername)}/acSubmission`
    );
    if (!response.ok) throw new Error('Recent AC request failed');

    const data = await response.json();
    const submissions = Array.isArray(data?.submission) ? data.submission.slice(0, 5) : [];

    leetcodeRecentAc.innerHTML = '';

    if (submissions.length === 0) {
      leetcodeRecentAc.innerHTML = '<li>No recent accepted submissions found.</li>';
      setPreviewError(previewLeetcode, 'No recent accepted submissions.');
      return;
    }

    submissions.forEach((sub) => leetcodeRecentAc.appendChild(createAcItem(sub)));

    const first = submissions[0];
    const when = formatRelativeTime(first.timestamp);
    renderPreview(previewLeetcode, {
      title: `Accepted · ${first.title}`,
      meta: `${prettifyLang(first.lang)}${when ? ` · ${when}` : ''}`,
      href: `https://leetcode.com/problems/${first.titleSlug}/`,
    });
  } catch {
    leetcodeRecentAc.innerHTML = '<li>Unable to load recent AC submissions right now.</li>';
    setPreviewError(previewLeetcode, 'Unable to load recent AC submissions.');
  }
}

async function loadLeetCodeStats() {
  if (!leetcodeStats || !leetcodeProfileLink) return;

  if (!leetcodeUsername) {
    leetcodeStats.innerHTML = '<p>No LeetCode username configured.</p>';
    return;
  }

  leetcodeProfileLink.href = `https://leetcode.com/u/${leetcodeUsername}/`;

  try {
    const response = await fetch(
      `${LEETCODE_API}/userProfile/${encodeURIComponent(leetcodeUsername)}`
    );
    if (!response.ok) throw new Error('LeetCode request failed');

    const stats = await response.json();
    if (!stats || stats.errors) throw new Error('LeetCode profile not found');

    renderLeetCodeStats(stats);
  } catch {
    leetcodeStats.innerHTML = '<p>Unable to load LeetCode stats right now.</p>';
  }
}

loadGithubActivity();
loadLeetCodeStats();
loadLeetCodeRecentAc();
