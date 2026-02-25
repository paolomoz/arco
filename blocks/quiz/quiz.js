/*
 * Quiz Block — Brew Style Quiz
 * Interactive multi-step quiz that maps answers to experience profiles.
 */

const EXPERIENCE_TAGS = [
  'morning-minimalist',
  'the-upgrade-path',
  'craft-at-home',
  'espresso-anywhere',
  'the-non-barista',
];

/**
 * Parses authored block rows into an array of question objects.
 * Each row has two cells: question text and comma-separated (or paragraph-separated) options.
 * @param {Element} block The quiz block element
 * @returns {Array<{text: string, options: string[]}>}
 */
function parseQuestions(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  return rows.map((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const text = cells[0]?.textContent.trim() || '';
    const optionCell = cells[1];
    let options = [];

    if (optionCell) {
      const paragraphs = [...optionCell.querySelectorAll('p')];
      if (paragraphs.length > 1) {
        // Each option is its own paragraph
        options = paragraphs.map((p) => p.textContent.trim()).filter(Boolean);
      } else {
        // Options are comma-separated in a single cell
        options = optionCell.textContent
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);
      }
    }

    return { text, options };
  });
}

/**
 * Determines the brew-style experience tag from the pattern of answer indices.
 * Uses a simple mapping: the combination of first-answer indices maps to a tag.
 * @param {number[]} answers Array of selected option indices (0-based)
 * @returns {string} The experience slug
 */
function resolveExperience(answers) {
  // Build a simple key from the answer indices
  const key = answers.join('-');

  // Direct mapping for common patterns
  const mapping = {
    '0-0-0': 'morning-minimalist',
    '0-0-1': 'morning-minimalist',
    '0-1-0': 'morning-minimalist',
    '1-1-1': 'craft-at-home',
    '1-1-0': 'craft-at-home',
    '1-0-1': 'the-upgrade-path',
    '1-0-0': 'the-upgrade-path',
    '0-1-1': 'the-upgrade-path',
    '2-2-2': 'espresso-anywhere',
    '2-0-2': 'espresso-anywhere',
    '2-2-0': 'espresso-anywhere',
    '2-0-0': 'the-upgrade-path',
    '2-1-2': 'espresso-anywhere',
    '2-2-1': 'espresso-anywhere',
    '2-1-0': 'craft-at-home',
    '2-1-1': 'craft-at-home',
    '2-0-1': 'espresso-anywhere',
    '3-3-3': 'the-non-barista',
    '3-3-0': 'the-non-barista',
    '3-3-1': 'the-non-barista',
    '3-3-2': 'the-non-barista',
    '3-0-3': 'the-non-barista',
    '3-1-3': 'the-non-barista',
    '3-2-3': 'the-non-barista',
    '0-3-3': 'the-non-barista',
    '1-3-3': 'the-non-barista',
    '0-0-3': 'morning-minimalist',
    '0-0-2': 'morning-minimalist',
    '1-1-2': 'craft-at-home',
    '1-1-3': 'craft-at-home',
    '0-2-0': 'espresso-anywhere',
    '0-2-1': 'espresso-anywhere',
    '0-2-2': 'espresso-anywhere',
    '0-2-3': 'espresso-anywhere',
    '1-2-0': 'craft-at-home',
    '1-2-1': 'craft-at-home',
    '1-2-2': 'espresso-anywhere',
    '1-2-3': 'espresso-anywhere',
    '0-3-0': 'morning-minimalist',
    '0-3-1': 'the-upgrade-path',
    '0-3-2': 'espresso-anywhere',
    '1-3-0': 'the-upgrade-path',
    '1-3-1': 'craft-at-home',
    '1-3-2': 'espresso-anywhere',
    '1-0-2': 'the-upgrade-path',
    '1-0-3': 'the-upgrade-path',
    '3-0-0': 'the-non-barista',
    '3-0-1': 'the-non-barista',
    '3-0-2': 'the-non-barista',
    '3-1-0': 'the-non-barista',
    '3-1-1': 'the-non-barista',
    '3-1-2': 'the-non-barista',
    '3-2-0': 'the-non-barista',
    '3-2-1': 'the-non-barista',
    '3-2-2': 'the-non-barista',
    '2-3-0': 'espresso-anywhere',
    '2-3-1': 'espresso-anywhere',
    '2-3-2': 'espresso-anywhere',
    '2-3-3': 'the-non-barista',
    '0-1-2': 'the-upgrade-path',
    '0-1-3': 'the-upgrade-path',
  };

  if (mapping[key]) return mapping[key];

  // Fallback: use the most frequent answer index to pick a tag
  const counts = [0, 0, 0, 0];
  answers.forEach((a) => {
    if (a >= 0 && a < counts.length) counts[a] += 1;
  });
  const dominant = counts.indexOf(Math.max(...counts));
  return EXPERIENCE_TAGS[dominant] || EXPERIENCE_TAGS[0];
}

/**
 * Sets a cookie with the given name, value, and expiry in days.
 * @param {string} name Cookie name
 * @param {string} value Cookie value
 * @param {number} days Days until expiry
 */
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Renders a single question step into the quiz container.
 * @param {Element} container The quiz inner container
 * @param {object} question The question object { text, options }
 * @param {number} index Current question index (0-based)
 * @param {number} total Total number of questions
 * @param {Function} onAnswer Callback when an option is selected
 */
function renderQuestion(container, question, index, total, onAnswer) {
  container.setAttribute('aria-live', 'polite');

  // Progress indicator
  const progress = document.createElement('div');
  progress.className = 'quiz-progress';
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-valuenow', index + 1);
  progress.setAttribute('aria-valuemin', 1);
  progress.setAttribute('aria-valuemax', total);
  progress.setAttribute('aria-label', `Question ${index + 1} of ${total}`);

  const progressTrack = document.createElement('div');
  progressTrack.className = 'quiz-progress-track';
  const progressFill = document.createElement('div');
  progressFill.className = 'quiz-progress-fill';
  progressFill.style.width = `${((index + 1) / total) * 100}%`;
  progressTrack.append(progressFill);

  const progressLabel = document.createElement('span');
  progressLabel.className = 'quiz-progress-label';
  progressLabel.textContent = `${index + 1} of ${total}`;

  progress.append(progressTrack, progressLabel);

  // Question text
  const heading = document.createElement('h3');
  heading.className = 'quiz-question';
  heading.id = `quiz-question-${index}`;
  heading.textContent = question.text;

  // Options grid
  const optionsGrid = document.createElement('div');
  optionsGrid.className = 'quiz-options';
  optionsGrid.setAttribute('role', 'group');
  optionsGrid.setAttribute('aria-labelledby', heading.id);

  question.options.forEach((option, optIdx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = option;
    btn.setAttribute('aria-label', `${option} — option ${optIdx + 1} of ${question.options.length}`);
    btn.addEventListener('click', () => {
      // Visual feedback: mark selected
      optionsGrid.querySelectorAll('.quiz-option').forEach((b) => {
        b.classList.remove('quiz-option-selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('quiz-option-selected');
      btn.setAttribute('aria-pressed', 'true');

      // Disable all buttons to prevent double-clicks
      optionsGrid.querySelectorAll('.quiz-option').forEach((b) => {
        b.disabled = true;
      });

      // Brief delay for visual feedback, then advance
      setTimeout(() => onAnswer(optIdx), 400);
    });
    btn.setAttribute('aria-pressed', 'false');
    optionsGrid.append(btn);
  });

  // Build the step
  const step = document.createElement('div');
  step.className = 'quiz-step';
  step.append(progress, heading, optionsGrid);

  // Transition: fade out old content, fade in new
  const existing = container.querySelector('.quiz-step');
  if (existing) {
    existing.classList.add('quiz-step-exit');
    setTimeout(() => {
      existing.remove();
      step.classList.add('quiz-step-enter');
      container.append(step);
      requestAnimationFrame(() => {
        step.classList.remove('quiz-step-enter');
      });
    }, 300);
  } else {
    container.append(step);
  }
}

/**
 * Loads and decorates the quiz block.
 * @param {Element} block The quiz block element
 */
export default async function decorate(block) {
  const questions = parseQuestions(block);

  if (questions.length === 0) return;

  // Clear authored content
  block.textContent = '';

  // Create inner container for transitions
  const container = document.createElement('div');
  container.className = 'quiz-container';
  block.append(container);

  const answers = [];
  const total = questions.length;

  const showQuestion = (index) => {
    renderQuestion(container, questions[index], index, total, (optIdx) => {
      answers.push(optIdx);

      if (index + 1 < total) {
        showQuestion(index + 1);
      } else {
        // Quiz complete — resolve experience
        const result = resolveExperience(answers);
        setCookie('arco-brew-style', result, 30);
        window.location.href = `/experiences/${result}`;
      }
    });
  };

  showQuestion(0);
}
