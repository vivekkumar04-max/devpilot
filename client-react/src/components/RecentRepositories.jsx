import { Clock3, ExternalLink, FolderGit2, RotateCw } from 'lucide-react';

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function RecentRepositories({ repositories = [], onAnalyze }) {
  return (
    <section className="recent-page">
      <div className="recent-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE HISTORY</div>
          <h1>Recent repositories</h1>
          <p>Repositories you have analyzed with DevPilot. Your 20 most recent repositories are saved to your account.</p>
        </div>
        <div className="recent-heading-icon"><FolderGit2 size={24}/></div>
      </div>

      {repositories.length === 0 ? (
        <div className="recent-empty">
          <FolderGit2 size={28}/>
          <h2>No repositories yet</h2>
          <p>Analyze a public GitHub repository and it will appear here for your next visit.</p>
        </div>
      ) : (
        <div className="recent-list">
          {repositories.map((repo) => (
            <article className="recent-card" key={repo.url}>
              <div className="recent-card-icon"><FolderGit2 size={19}/></div>
              <div className="recent-card-main">
                <a href={repo.url} target="_blank" rel="noreferrer" className="recent-repo-name">
                  {repo.name} <ExternalLink size={13}/>
                </a>
                <p>{repo.description || 'No repository description provided.'}</p>
                <div className="recent-meta">
                  {repo.language && <span>{repo.language}</span>}
                  {repo.defaultBranch && <span>Branch: {repo.defaultBranch}</span>}
                  <span>{repo.fileCount ?? 0} files inspected</span>
                  <span><Clock3 size={12}/> {formatDate(repo.lastAnalyzed)}</span>
                </div>
                {repo.planSummary && <div className="recent-summary">{repo.planSummary}</div>}
              </div>
              <button className="button secondary recent-analyze" onClick={() => onAnalyze(repo.url)}>
                <RotateCw size={14}/> Analyze again
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
