(function () {
  const token = localStorage.getItem("hn_token");
  const username = localStorage.getItem("hn_username");

  if (token && username) {
    document.querySelectorAll('a[href="/auth"]').forEach((link) => {
      link.setAttribute("href", `/dashboard/${username}`);
      if (link.classList.contains("nav-cta")) link.textContent = "Dashboard";
      if (link.classList.contains("btn-primary")) link.textContent = "Go to dashboard";
    });
  }
})();
