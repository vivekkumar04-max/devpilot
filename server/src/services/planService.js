import { generateSetupPlan } from "./geminiService.js";

function inferStack(repo) {
  const files = repo.files || [];

  const has = (filename) => files.includes(filename);

  return {
    hasReadme: files.some((file) => /^README\.md$/i.test(file)),
    hasPackageJson: files
      .filter((file) => file.endsWith("package.json"))
      .slice(0, 8),

    hasVite: files.some((file) =>
      /(^|\/)vite\.config\.[^/]+$/.test(file)
    ),

    hasDocker: files.some((file) =>
      /(^|\/)Dockerfile$/.test(file)
    ),

    hasCompose: files.some((file) =>
      /(^|\/)docker-compose\.(yaml|yml)$/.test(file)
    ),

    hasEnvExample: files.some((file) =>
      /(^|\/)\.env\.(example|sample)$/.test(file)
    ),

    hasLock: [
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",
    ].some(has),

    hasNvmrc: has(".nvmrc"),
    hasRequirements: files.some((file) =>
      file.endsWith("requirements.txt")
    ),
  };
}

function fallbackPlan(repo, stack) {
  return {
    summary: `Starter setup plan for ${repo.name}. This is a fallback checklist based on repository metadata and file paths, not a Gemini-generated analysis.`,

    technologies: [
      repo.language,
      stack.hasVite ? "Vite" : null,
      stack.hasDocker ? "Docker" : null,
    ].filter(Boolean),

    steps: [
      {
        title: "Read the repository documentation",
        description:
          "Read the README and project documentation to understand the application and its requirements.",
        command: null,
        verify: "Identify the documented prerequisites and startup instructions.",
      },
      {
        title: "Check the prerequisites",
        description:
          "Determine which runtimes and tools the project requires before installing dependencies.",
        command: null,
        verify: "Confirm the required tools are installed.",
      },
      {
        title: "Clone the repository",
        description:
          "Clone the repository into a local development directory.",
        command: repo.htmlUrl
          ? `git clone ${repo.htmlUrl.replace(/\.git$/, "")}.git`
          : null,
        verify: "Confirm that the project files are present locally.",
      },
      {
        title: "Inspect dependencies",
        description:
          "Inspect the dependency manifests and identify the package manager or installation method used by the project.",
        command: null,
        verify: "Identify the documented dependency installation procedure.",
      },
      {
        title: "Install dependencies",
        description:
          "Install the required dependencies using the procedure documented by the repository.",
        command: null,
        verify: "Confirm that dependency installation completes successfully.",
      },
      {
        title: "Configure environment variables",
        description: stack.hasEnvExample
          ? "Inspect the example environment file and configure the required local values without committing secrets."
          : "Check the README and project files for environment variables required to run the application.",
        command: null,
        verify: "Confirm that required configuration values are available.",
      },
      {
        title: "Configure external services",
        description:
          "Determine whether the application requires a database, API credentials, or other external services.",
        command: null,
        verify: "Confirm that the required services are configured.",
      },
      {
        title: "Start the application",
        description:
          "Follow the startup instructions documented in the README or the relevant project configuration files.",
        command: null,
        verify: "Check the terminal output for startup errors.",
      },
      {
        title: "Verify the application",
        description:
          "Follow the documented verification steps and check the application's main functionality.",
        command: null,
        verify: "Confirm that the application behaves as expected.",
      },
    ],
  };
}

export async function createSetupPlan(repo) {
  const stack = inferStack(repo);
  const fallback = fallbackPlan(repo, stack);

  try {
    const repositoryContext = JSON.stringify({
      repository: {
        name: repo.name,
        description: repo.description,
        url: repo.htmlUrl,
        defaultBranch: repo.defaultBranch,
        language: repo.language,
        topics: repo.topics,

        // Actual README text is now included.
        readme: (repo.readmeContent || "").slice(0, 20000),

        // Provide the file structure for project interpretation.
        filePaths: (repo.files || []).slice(0, 700),

        stackHints: stack,
      },
    });

    console.log(
      `[DevPilot] Sending ${repo.name} to Gemini with README and file structure.`
    );

    const result = await generateSetupPlan(repositoryContext);
    const parsed = JSON.parse(result);

    if (
      !parsed ||
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.technologies) ||
      !Array.isArray(parsed.steps) ||
      parsed.steps.length === 0
    ) {
      throw new Error("Gemini returned an invalid setup plan.");
    }

    const steps = parsed.steps.slice(0, 12).map((step, index) => ({
      id: `step-${index + 1}`,

      title: String(step.title || `Step ${index + 1}`),

      description: String(step.description || ""),

      command:
        typeof step.command === "string" && step.command.trim()
          ? step.command
          : null,

      verify: String(
        step.verify || "Verify this step manually."
      ),
    }));

    console.log(
      `[DevPilot] Gemini generated ${steps.length} setup steps for ${repo.name}.`
    );

    return {
      summary: parsed.summary,

      technologies: parsed.technologies.map(String),

      steps,

      mode: "gemini",
    };
  } catch (error) {
    console.error(
      `[DevPilot] Gemini analysis failed for ${repo.name}:`,
      error.message
    );

    return {
      ...fallback,
      mode: "template",
      note:
        "Gemini could not generate the AI setup plan. This is a fallback checklist, not an AI-generated analysis. Check the server terminal for details.",
    };
  }
}