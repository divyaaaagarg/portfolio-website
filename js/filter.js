/* Project search logic.
   Kept in its own file so it can run in the browser and be tested in Node. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ProjectFilter = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  // Returns the projects whose title, description or technologies
  // contain every word the visitor typed (case-insensitive).
  function filterProjects(projects, query) {
    var words = String(query || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return projects.slice();

    return projects.filter(function (p) {
      var haystack = [p.title, p.description, (p.technologies || []).join(" ")]
        .join(" ")
        .toLowerCase();
      return words.every(function (w) {
        return haystack.indexOf(w) !== -1;
      });
    });
  }

  return { filterProjects: filterProjects };
});

