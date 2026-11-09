# Living Off the Script: Hunting T1059 in the Wild

Workshop materials for **DEATHCon 2026** by [Igor Moura](https://github.com/mouralgor).

**Website:** https://mouralgor.github.io/deathcon2026-living-off-the-script/

| | |
| --- | --- |
| Video | [YouTube](https://www.youtube.com/watch?v=KvTerx2QEtI) · [Download (Sync.com)](https://ln5.sync.com/dl/46453c680#wi68r9vz-kwzvrcrp-q6r7zy2w-3uxpn3y9) |
| Lab | [TryHackMe room](https://tryhackme.com/jr/deathcon2026challenge), available until 31 December 2026 |
| Lab guide (no spoilers) | [lab-guide.md](lab-guide.md) |
| Detection rules (Sigma) | [rules/](rules/) |
| Resources | [resources.md](resources.md) |

The lab data is synthetic and every name, IP address and domain in the scenario is fictional.

## Site

The site is plain Jekyll on GitHub Pages, with a small custom layout instead of a theme:

- `_layouts/default.html`: top bar, sidebar with the pages, page title from front matter (`title`, `description`), previous/next links and footer
- `assets/css/site.css`: the styles (dark, Geist and Geist Mono, red accent)
- `assets/js/site.js`: lists the current page's sections in the sidebar and adds a copy button to code blocks. The pages read fine without it.

The page order in the sidebar comes from `nav` in `_config.yml`.

To preview locally: `docker run --rm -p 4000:4000 -v "$PWD":/srv -w /srv ruby:3.3 bash -c "gem install github-pages webrick && jekyll serve -H 0.0.0.0"`, then open http://localhost:4000/deathcon2026-living-off-the-script/.
