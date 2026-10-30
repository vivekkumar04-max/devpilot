export async function getPublicRepository(repoUrl) {
  let url;

  try {
    url = new URL(repoUrl);
  } catch {
    throw new Error("Enter a valid GitHub repository URL.");
  }

  if (url.hostname !== "github.com") {
    throw new Error("Only public GitHub repositories are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length < 2) {
    throw new Error(
      "Enter a repository URL like https://github.com/owner/repository"
    );
  }

  const [owner, repoRaw] = parts;
  const repo = repoRaw.replace(/\.git$/, "");

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "DevPilot",
  };

  const baseUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  // Fetch repository metadata.
  const metaResponse = await fetch(baseUrl, { headers });

  if (!metaResponse.ok) {
    if (metaResponse.status === 404) {
      throw new Error("Repository not found or not public.");
    }

    throw new Error(
      `GitHub API returned ${metaResponse.status} while fetching repository metadata.`
    );
  }

  const meta = await metaResponse.json();

  // Fetch the file structure and README together.
  const [treeResult, readmeResult] = await Promise.all([
    fetch(
      `${baseUrl}/git/trees/${encodeURIComponent(meta.default_branch)}?recursive=1`,
      { headers }
    ),

    fetch(
      `${baseUrl}/readme?ref=${encodeURIComponent(meta.default_branch)}`,
      { headers }
    ),
  ]);

  let files = [];
  let readmeContent = "";

  if (treeResult.ok) {
    const tree = await treeResult.json();

    files = (tree.tree || [])
      .filter((item) => item.type === "blob")
      .map((item) => item.path)
      .slice(0, 2500);
  } else {
    console.warn(
      `[GitHub] Could not fetch file structure: ${treeResult.status}`
    );
  }

  if (readmeResult.ok) {
    const readme = await readmeResult.json();

    if (readme.encoding === "base64" && readme.content) {
      readmeContent = Buffer.from(
        readme.content,
        "base64"
      ).toString("utf8");
    }
  } else {
    console.warn(
      `[GitHub] Could not fetch README: ${readmeResult.status}`
    );
  }

  if (files.length === 0) {
    throw new Error(
      "Could not retrieve the repository file structure from GitHub."
    );
  }

  if (!readmeContent) {
    console.warn(
      "[GitHub] README unavailable. Gemini will analyze the file structure instead."
    );
  }

  console.log(
    `[GitHub] Retrieved ${files.length} file paths and ${readmeContent.length} README characters.`
  );

  return {
    owner,
    repo,
    name: meta.full_name,
    description: meta.description || "",
    htmlUrl: meta.html_url,
    defaultBranch: meta.default_branch,
    language: meta.language,
    topics: meta.topics || [],
    files,
    readmeContent: readmeContent.slice(0, 20000),
  };
}