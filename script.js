(() => {
  const content = window.SITE_CONTENT;
  if (!content) return;

  document.title = `${content.name} — 소개`;

  document.querySelectorAll("[data-content]").forEach((element) => {
    const key = element.dataset.content;
    if (content[key] !== undefined) element.textContent = content[key];
  });

  document.querySelectorAll('[data-link="email"]').forEach((element) => {
    if (content.email) {
      element.href = `mailto:${content.email}`;
    } else {
      element.hidden = true;
    }
  });

  const interestList = document.querySelector('[data-list="interests"]');
  content.interests.forEach((interest) => {
    const item = document.createElement("li");
    item.textContent = interest;
    interestList.append(item);
  });
  interestList.hidden = content.interests.length === 0;

  const projectList = document.querySelector('[data-list="projects"]');

  const createProjectCard = (project, index) => {
    const card = document.createElement(project.url ? "a" : "article");
    card.className = "project-card";
    if (project.url) {
      card.href = project.url;
      card.target = project.url.startsWith("http") ? "_blank" : "_self";
      card.rel = project.url.startsWith("http") ? "noreferrer" : "";
      card.setAttribute("aria-label", `${project.title} 프로젝트 보기`);
    }

    const number = document.createElement("span");
    number.className = "project-card__number";
    number.textContent = String(index + 1).padStart(2, "0");

    const title = document.createElement("h3");
    title.textContent = project.title;

    const description = document.createElement("p");
    description.textContent = project.description || "설명이 아직 없습니다.";

    card.append(number, title, description);

    if (project.meta?.length) {
      const meta = document.createElement("p");
      meta.className = "project-card__meta";
      project.meta.forEach((value) => {
        const item = document.createElement("span");
        item.textContent = value;
        meta.append(item);
      });
      card.append(meta);
    }

    if (project.url) {
      const linkText = document.createElement("span");
      linkText.className = "project-card__link";
      linkText.innerHTML = '프로젝트 보기 <span aria-hidden="true">↗</span>';
      card.append(linkText);
    }

    return card;
  };

  const hideProjects = () => {
    document.querySelector("#projects").hidden = true;
    document.querySelectorAll('a[href="#projects"]').forEach((link) => {
      link.hidden = true;
    });
  };

  const renderProjects = (projects) => {
    projectList.replaceChildren();
    projects.forEach((project, index) => {
      projectList.append(createProjectCard(project, index));
    });
    if (projects.length === 0) hideProjects();
  };

  const loadRepositories = async () => {
    if (!content.githubUsername) {
      renderProjects(content.projects);
      return;
    }

    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(content.githubUsername)}/repos?sort=updated&per_page=100`,
        { headers: { Accept: "application/vnd.github+json" } },
      );
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);

      const repositories = (await response.json())
        .filter((repository) => !repository.fork && !repository.archived)
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, content.repoLimit || 6)
        .map((repository) => ({
          title: repository.name,
          description: repository.description,
          url: `https://github.com/${encodeURIComponent(content.githubUsername)}/${encodeURIComponent(repository.name)}`,
          meta: [
            repository.language,
            `업데이트 ${new Intl.DateTimeFormat("ko-KR", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(new Date(repository.pushed_at))}`,
          ].filter(Boolean),
        }));

      renderProjects(repositories);
    } catch (error) {
      if (content.projects.length) {
        renderProjects(content.projects);
        return;
      }

      projectList.replaceChildren();
      const message = document.createElement("p");
      message.className = "repo-state";
      message.textContent = "저장소를 불러오지 못했습니다. ";
      const profileLink = document.createElement("a");
      profileLink.href = `https://github.com/${encodeURIComponent(content.githubUsername)}`;
      profileLink.target = "_blank";
      profileLink.rel = "noreferrer";
      profileLink.textContent = "GitHub에서 직접 보기";
      message.append(profileLink);
      projectList.append(message);
    }
  };

  loadRepositories();

  const linkList = document.querySelector('[data-list="links"]');
  content.links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.textContent = link.label;
    if (link.url.startsWith("http")) {
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
    }
    linkList.append(anchor);
  });

  if (content.links.length === 0 && !content.contactMessage) {
    document.querySelector("#contact").hidden = true;
    document.querySelectorAll('a[href="#contact"]').forEach((link) => {
      link.hidden = true;
    });
  }

  document.querySelectorAll(".profile-card__meta > div").forEach((item) => {
    const value = item.querySelector("dd");
    if (!value?.textContent.trim()) item.hidden = true;
  });

  const profileMeta = document.querySelector(".profile-card__meta");
  if (![...profileMeta.children].some((item) => !item.hidden)) {
    profileMeta.hidden = true;
  }

  const profileVisual = document.querySelector("[data-profile-visual]");
  if (content.profileImage) {
    profileVisual.style.backgroundImage = `linear-gradient(180deg, transparent 45%, rgba(12, 14, 28, 0.55)), url("${content.profileImage}")`;
    profileVisual.classList.add("has-image");
  }

  document.querySelector("[data-year]").textContent = new Date().getFullYear();

  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  const savedTheme = localStorage.getItem("site-theme");
  const preferredTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
  };

  applyTheme(savedTheme || preferredTheme);

  themeButton.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem("site-theme", nextTheme);
  });
})();
