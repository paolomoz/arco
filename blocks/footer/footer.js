import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Restructure flat content into grid-friendly sections
  const wrapper = footer.querySelector('.default-content-wrapper');
  if (wrapper) {
    const newsletter = document.createElement('div');
    newsletter.className = 'footer-newsletter';

    const columns = document.createElement('div');
    columns.className = 'footer-columns';

    const copyright = document.createElement('div');
    copyright.className = 'footer-copyright';

    let currentCol = null;
    let inColumns = false;

    [...wrapper.children].forEach((el) => {
      if (el.tagName === 'H3') {
        inColumns = true;
        currentCol = document.createElement('div');
        currentCol.className = 'footer-column';
        currentCol.appendChild(el);
        columns.appendChild(currentCol);
      } else if (el.tagName === 'UL' && currentCol) {
        currentCol.appendChild(el);
      } else if (inColumns && el.tagName === 'P') {
        copyright.appendChild(el);
      } else {
        newsletter.appendChild(el);
      }
    });

    wrapper.replaceWith(newsletter, columns, copyright);
  }

  block.append(footer);
}
