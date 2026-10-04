const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const projectsEl = document.getElementById('github-projects');
const username = 'Masbismaa';
async function loadProjects() {
  if (!projectsEl) return;
  try {
    const res = await fetch(https://api.github.com/users//repos?per_page=100&sort=pushed);
    if (!res.ok) throw new Error('Failed');
    const repos = await res.json();
    const filtered = repos
      .filter(r => !r.fork)
      .sort((a,b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at)-new Date(a.pushed_at)))
      .slice(0,6);
    if (filtered.length === 0) {
      projectsEl.innerHTML = '<p style="color:#A9A9A9">No public repos to display.</p>';
      return;
    }
    projectsEl.innerHTML = filtered.map(r => 
      <article class="project-card">
        <div class="project-card-content">
          <h3></h3>
          <p></p>
          <div class="project-meta">
            <span>★ </span>
            <span>⑂ </span>
            <span></span>
            <span>Updated </span>
          </div>
          <a href="" target="_blank" rel="noopener" class="project-link">Lihat Repo →</a>
        </div>
      </article>
    ).join('');
  } catch (e) {
    projectsEl.innerHTML = '<p style="color:#A9A9A9">Failed to load projects from GitHub.</p>';
  }
}
loadProjects();

const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    if (links) links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  });
}
