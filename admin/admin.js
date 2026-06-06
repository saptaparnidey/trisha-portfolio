/* Admin panel logic for the Trisha Halder portfolio CMS. */
(function () {
  'use strict';

  /** Auto-clear delay (ms) for transient status messages. */
  var STATUS_CLEAR_MS = 4000;

  /** In-memory content document, loaded from the server and saved back. */
  var content = null;

  /** Quill editor instance for the project detail body (created lazily). */
  var quill = null;

  /** Index of the project currently open in the modal, or -1 when adding. */
  var editingIndex = -1;

  /** Index of the client currently open in the client modal, or -1 when adding. */
  var editingClientIndex = -1;

  var statusEl = document.getElementById('status');

  /* ---------------- Helpers ---------------- */

  /**
   * Shows a transient status message in the top bar.
   * @param {string} message Text to display.
   * @param {string} kind One of "", "success", "error".
   */
  function setStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
    if (message) {
      window.clearTimeout(setStatus._t);
      setStatus._t = window.setTimeout(function () {
        statusEl.textContent = '';
        statusEl.className = 'status';
      }, STATUS_CLEAR_MS);
    }
  }

  /** Shorthand for document.getElementById. */
  function el(id) {
    return document.getElementById(id);
  }

  /**
   * Uploads an image file and returns its public URL.
   * @param {File} file The selected file.
   * @returns {Promise<string>} Resolves with the stored image URL.
   */
  function uploadImage(file) {
    var fd = new FormData();
    fd.append('image', file);
    return fetch('/api/upload', { method: 'POST', body: fd })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (d) {
            throw new Error(d.error || 'Upload failed');
          });
        }
        return res.json();
      })
      .then(function (d) {
        return d.url;
      });
  }

  /**
   * Wires a file input to upload on change and update a URL field + preview.
   * @param {string} fileId File input element id.
   * @param {string} urlId Text input element id receiving the URL.
   * @param {string} previewId Image preview element id.
   */
  function bindUpload(fileId, urlId, previewId) {
    el(fileId).addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      setStatus('Uploading image...', '');
      uploadImage(file)
        .then(function (url) {
          el(urlId).value = url;
          if (previewId) el(previewId).src = url;
          setStatus('Image uploaded', 'success');
        })
        .catch(function (err) {
          setStatus(err.message, 'error');
        });
    });
  }

  /* ---------------- Tabs ---------------- */

  function initTabs() {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) {
          t.classList.remove('active');
        });
        document.querySelectorAll('.panel').forEach(function (p) {
          p.classList.remove('active');
        });
        tab.classList.add('active');
        document
          .querySelector('.panel[data-panel="' + tab.dataset.tab + '"]')
          .classList.add('active');
      });
    });
  }

  /* ---------------- Repeaters (paragraphs / footer lines) ---------------- */

  /**
   * Renders a list of textareas for an array of strings.
   * @param {string} containerId Container element id.
   * @param {string[]} values Current string values.
   */
  function renderTextRepeater(containerId, values) {
    var container = el(containerId);
    container.innerHTML = '';
    values.forEach(function (val, i) {
      var item = document.createElement('div');
      item.className = 'repeater-item';
      var ta = document.createElement('textarea');
      ta.rows = 2;
      ta.value = val;
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'remove-x';
      rm.innerHTML = '&times;';
      rm.title = 'Remove';
      rm.addEventListener('click', function () {
        values.splice(i, 1);
        renderTextRepeater(containerId, values);
      });
      item.appendChild(ta);
      item.appendChild(rm);
      container.appendChild(item);
    });
  }

  /**
   * Reads current textarea values from a repeater back into an array.
   * @param {string} containerId Container element id.
   * @returns {string[]} The current values.
   */
  function readTextRepeater(containerId) {
    return Array.prototype.map
      .call(el(containerId).querySelectorAll('textarea'), function (t) {
        return t.value;
      })
      .filter(function (v) {
        return v.trim() !== '';
      });
  }

  /* ---------------- Skills (tags) ---------------- */

  function renderSkills(values) {
    var container = el('about-skills');
    container.innerHTML = '';
    values.forEach(function (val, i) {
      var item = document.createElement('span');
      item.className = 'tag-item';
      var input = document.createElement('input');
      input.type = 'text';
      input.value = val;
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'remove-x';
      rm.innerHTML = '&times;';
      rm.addEventListener('click', function () {
        values.splice(i, 1);
        renderSkills(values);
      });
      item.appendChild(input);
      item.appendChild(rm);
      container.appendChild(item);
    });
  }

  function readSkills() {
    return Array.prototype.map
      .call(el('about-skills').querySelectorAll('input'), function (t) {
        return t.value;
      })
      .filter(function (v) {
        return v.trim() !== '';
      });
  }

  /* ---------------- Project list ---------------- */

  function renderProjects() {
    var list = el('project-list');
    list.innerHTML = '';
    content.portfolio.projects.forEach(function (project, index) {
      var row = document.createElement('div');
      row.className = 'project-row';

      var img = document.createElement('img');
      img.src = project.cardImage || '';
      img.alt = '';

      var main = document.createElement('div');
      main.className = 'pr-main';
      var title = document.createElement('div');
      title.className = 'pr-title';
      title.textContent = project.title || '(untitled)';
      var cat = document.createElement('div');
      cat.className = 'pr-cat';
      cat.textContent = project.category || '';
      main.appendChild(title);
      main.appendChild(cat);

      var move = document.createElement('div');
      move.className = 'move-btns';
      var up = document.createElement('button');
      up.type = 'button';
      up.innerHTML = '&uarr;';
      up.disabled = index === 0;
      up.addEventListener('click', function () {
        swapProjects(index, index - 1);
      });
      var down = document.createElement('button');
      down.type = 'button';
      down.innerHTML = '&darr;';
      down.disabled = index === content.portfolio.projects.length - 1;
      down.addEventListener('click', function () {
        swapProjects(index, index + 1);
      });
      move.appendChild(up);
      move.appendChild(down);

      var actions = document.createElement('div');
      actions.className = 'pr-actions';
      var edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-secondary btn-tiny';
      edit.textContent = 'View / Edit Detail';
      edit.addEventListener('click', function () {
        openProjectModal(index);
      });
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-danger btn-tiny';
      del.textContent = 'Delete';
      del.addEventListener('click', function () {
        if (window.confirm('Delete "' + (project.title || 'this project') + '"?')) {
          content.portfolio.projects.splice(index, 1);
          renderProjects();
        }
      });
      actions.appendChild(edit);
      actions.appendChild(del);

      row.appendChild(move);
      row.appendChild(img);
      row.appendChild(main);
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  function swapProjects(a, b) {
    var arr = content.portfolio.projects;
    var tmp = arr[a];
    arr[a] = arr[b];
    arr[b] = tmp;
    renderProjects();
  }

  /* ---------------- Project modal ---------------- */

  function ensureQuill() {
    if (!quill) {
      quill = new Quill('#p-detail-editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'link'],
            ['clean'],
          ],
        },
      });
    }
  }

  function openProjectModal(index) {
    editingIndex = index;
    var p = content.portfolio.projects[index];
    var detail = p.detail || {};

    el('modal-title').textContent = 'Edit: ' + (p.title || 'Project');
    el('p-title').value = p.title || '';
    el('p-category').value = p.category || '';
    el('p-description').value = p.description || '';
    el('p-card-image').value = p.cardImage || '';
    el('p-card-image-preview').src = p.cardImage || '';
    el('p-card-image-alt').value = p.cardImageAlt || '';
    el('p-detail-intro').value = detail.intro || '';
    el('p-detail-hero').value = detail.heroImage || '';
    el('p-detail-hero-preview').src = detail.heroImage || '';

    var work = detail.work || {};
    el('p-work-type').value = work.type || '';
    el('p-work-url').value = work.url || '';
    el('p-work-file-name').textContent = '';

    ensureQuill();
    quill.root.innerHTML = detail.bodyHtml || '';

    el('project-modal').hidden = false;
  }

  function closeProjectModal() {
    el('project-modal').hidden = true;
    editingIndex = -1;
  }

  function applyProjectModal() {
    if (editingIndex < 0) return;
    var p = content.portfolio.projects[editingIndex];
    p.title = el('p-title').value;
    p.category = el('p-category').value;
    p.description = el('p-description').value;
    p.cardImage = el('p-card-image').value;
    p.cardImageAlt = el('p-card-image-alt').value;
    p.detail = p.detail || {};
    p.detail.intro = el('p-detail-intro').value;
    p.detail.heroImage = el('p-detail-hero').value;
    p.detail.bodyHtml = quill ? quill.root.innerHTML : p.detail.bodyHtml;

    var workType = el('p-work-type').value;
    var workUrl = el('p-work-url').value.trim();
    if (workType && workUrl) {
      p.detail.work = { type: workType, url: workUrl };
    } else {
      delete p.detail.work;
    }
    p.detail.externalLink = '';
    renderProjects();
    closeProjectModal();
  }

  function addProject() {
    var project = {
      id: '',
      slug: '',
      category: 'SEO Content',
      title: 'New Project',
      description: '',
      cardImage: '',
      cardImageAlt: '',
      detail: { heroImage: '', intro: '', bodyHtml: '', externalLink: '' },
    };
    content.portfolio.projects.push(project);
    renderProjects();
    openProjectModal(content.portfolio.projects.length - 1);
  }

  /* ---------------- Client list ---------------- */

  function ensureClients() {
    if (!content.clients) {
      content.clients = { heading: 'My Clients', subheading: '', items: [] };
    }
    if (!content.clients.items) {
      content.clients.items = [];
    }
  }

  function renderClients() {
    ensureClients();
    var list = el('client-list');
    list.innerHTML = '';
    content.clients.items.forEach(function (client, index) {
      var row = document.createElement('div');
      row.className = 'project-row';

      var img = document.createElement('img');
      img.src = client.thumbnail || '';
      img.alt = '';

      var main = document.createElement('div');
      main.className = 'pr-main';
      var title = document.createElement('div');
      title.className = 'pr-title';
      title.textContent = client.name || '(untitled)';
      var cat = document.createElement('div');
      cat.className = 'pr-cat';
      cat.textContent = client.category || '';
      main.appendChild(title);
      main.appendChild(cat);

      var move = document.createElement('div');
      move.className = 'move-btns';
      var up = document.createElement('button');
      up.type = 'button';
      up.innerHTML = '&uarr;';
      up.disabled = index === 0;
      up.addEventListener('click', function () {
        swapClients(index, index - 1);
      });
      var down = document.createElement('button');
      down.type = 'button';
      down.innerHTML = '&darr;';
      down.disabled = index === content.clients.items.length - 1;
      down.addEventListener('click', function () {
        swapClients(index, index + 1);
      });
      move.appendChild(up);
      move.appendChild(down);

      var actions = document.createElement('div');
      actions.className = 'pr-actions';
      var edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-secondary btn-tiny';
      edit.textContent = 'Edit';
      edit.addEventListener('click', function () {
        openClientModal(index);
      });
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-danger btn-tiny';
      del.textContent = 'Delete';
      del.addEventListener('click', function () {
        if (window.confirm('Delete "' + (client.name || 'this client') + '"?')) {
          content.clients.items.splice(index, 1);
          renderClients();
        }
      });
      actions.appendChild(edit);
      actions.appendChild(del);

      row.appendChild(move);
      row.appendChild(img);
      row.appendChild(main);
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  function swapClients(a, b) {
    var arr = content.clients.items;
    var tmp = arr[a];
    arr[a] = arr[b];
    arr[b] = tmp;
    renderClients();
  }

  function openClientModal(index) {
    editingClientIndex = index;
    var c = content.clients.items[index];
    el('client-modal-title').textContent = 'Edit: ' + (c.name || 'Client');
    el('c-name').value = c.name || '';
    el('c-category').value = c.category || '';
    el('c-description').value = c.description || '';
    el('c-thumbnail').value = c.thumbnail || '';
    el('c-thumbnail-preview').src = c.thumbnail || '';
    el('c-thumbnail-alt').value = c.thumbnailAlt || '';
    el('client-modal').hidden = false;
  }

  function closeClientModal() {
    el('client-modal').hidden = true;
    editingClientIndex = -1;
  }

  function applyClientModal() {
    if (editingClientIndex < 0) return;
    var c = content.clients.items[editingClientIndex];
    c.name = el('c-name').value;
    c.category = el('c-category').value;
    c.description = el('c-description').value;
    c.thumbnail = el('c-thumbnail').value;
    c.thumbnailAlt = el('c-thumbnail-alt').value;
    renderClients();
    closeClientModal();
  }

  function addClient() {
    ensureClients();
    var client = {
      id: '',
      name: 'New Client',
      category: 'Content Writing',
      description: '',
      thumbnail: '',
      thumbnailAlt: '',
    };
    content.clients.items.push(client);
    renderClients();
    openClientModal(content.clients.items.length - 1);
  }

  /* ---------------- Resume list ---------------- */

  function ensureResume() {
    if (!content.resume) {
      content.resume = { heading: 'My Resume', subheading: '', items: [] };
    }
    if (!content.resume.items) {
      content.resume.items = [];
    }
  }

  function renderResumes() {
    ensureResume();
    var list = el('resume-list');
    list.innerHTML = '';
    content.resume.items.forEach(function (item, index) {
      var row = document.createElement('div');
      row.className = 'project-row';

      var icon = document.createElement('div');
      icon.className = 'pr-main';
      icon.style.fontSize = '2rem';
      icon.textContent = '📄';

      var main = document.createElement('div');
      main.className = 'pr-main';
      var title = document.createElement('div');
      title.className = 'pr-title';
      title.textContent = item.label || item.fileName || '(untitled)';
      var url = document.createElement('div');
      url.className = 'pr-cat';
      url.textContent = item.fileUrl || '';
      main.appendChild(title);
      main.appendChild(url);

      var badge = document.createElement('span');
      badge.className = 'pr-cat';
      if (index === content.resume.items.length - 1) {
        badge.textContent = 'Live on site';
        badge.style.color = 'var(--success, #2ecc71)';
        badge.style.fontWeight = '600';
      }

      var actions = document.createElement('div');
      actions.className = 'pr-actions';
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-danger btn-tiny';
      del.textContent = 'Delete';
      del.addEventListener('click', function () {
        if (window.confirm('Delete this resume file?')) {
          content.resume.items.splice(index, 1);
          renderResumes();
        }
      });
      actions.appendChild(del);

      row.appendChild(icon);
      row.appendChild(main);
      if (index === content.resume.items.length - 1) {
        row.appendChild(badge);
      }
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  function addResume() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      setStatus('Uploading resume...', '');
      var fd = new FormData();
      fd.append('file', file);
      fetch('/api/upload-file', { method: 'POST', body: fd })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (d) {
              throw new Error(d.error || 'Upload failed');
            });
          }
          return res.json();
        })
        .then(function (d) {
          ensureResume();
          content.resume.items.push({
            id: '',
            label: file.name.replace(/\.pdf$/i, ''),
            fileUrl: d.url,
            fileName: file.name,
          });
          renderResumes();
          setStatus('Resume uploaded', 'success');
        })
        .catch(function (err) {
          setStatus(err.message, 'error');
        });
    });
    input.click();
  }

  /* ---------------- Load / populate ---------------- */

  function populate() {
    el('hero-name').value = content.hero.name || '';
    el('hero-subtitle').value = content.hero.subtitle || '';
    el('hero-description').value = content.hero.description || '';
    el('hero-primary-label').value = content.hero.primaryBtn.label || '';
    el('hero-primary-href').value = content.hero.primaryBtn.href || '';
    el('hero-secondary-label').value = content.hero.secondaryBtn.label || '';
    el('hero-secondary-href').value = content.hero.secondaryBtn.href || '';

    el('about-heading').value = content.about.heading || '';
    el('about-tagline').value = content.about.tagline || '';
    el('about-image').value = content.about.image || '';
    el('about-image-preview').src = content.about.image || '';
    el('about-image-alt').value = content.about.imageAlt || '';
    renderTextRepeater('about-paragraphs', content.about.paragraphs);
    renderSkills(content.about.skills);

    el('portfolio-heading').value = content.portfolio.heading || '';
    el('portfolio-subheading').value = content.portfolio.subheading || '';
    renderProjects();

    ensureClients();
    el('clients-heading').value = content.clients.heading || '';
    el('clients-subheading').value = content.clients.subheading || '';
    renderClients();

    ensureResume();
    el('resume-heading').value = content.resume.heading || '';
    el('resume-subheading').value = content.resume.subheading || '';
    renderResumes();

    el('contact-heading').value = content.contact.heading || '';
    el('contact-subtext').value = content.contact.subtext || '';
    el('contact-email').value = content.contact.email || '';
    el('contact-whatsapp').value = content.contact.whatsapp || '';
    el('contact-whatsapp-link').value = content.contact.whatsappLink || '';
    el('contact-instagram').value = content.contact.instagram || '';
    el('contact-linkedin').value = content.contact.linkedin || '';
    renderTextRepeater('footer-lines', content.footer.lines);
  }

  /**
   * Pulls the current values out of all DOM fields into the content object.
   */
  function collect() {
    content.hero.name = el('hero-name').value;
    content.hero.subtitle = el('hero-subtitle').value;
    content.hero.description = el('hero-description').value;
    content.hero.primaryBtn.label = el('hero-primary-label').value;
    content.hero.primaryBtn.href = el('hero-primary-href').value;
    content.hero.secondaryBtn.label = el('hero-secondary-label').value;
    content.hero.secondaryBtn.href = el('hero-secondary-href').value;

    content.about.heading = el('about-heading').value;
    content.about.tagline = el('about-tagline').value;
    content.about.image = el('about-image').value;
    content.about.imageAlt = el('about-image-alt').value;
    content.about.paragraphs = readTextRepeater('about-paragraphs');
    content.about.skills = readSkills();

    content.portfolio.heading = el('portfolio-heading').value;
    content.portfolio.subheading = el('portfolio-subheading').value;

    ensureClients();
    content.clients.heading = el('clients-heading').value;
    content.clients.subheading = el('clients-subheading').value;

    ensureResume();
    content.resume.heading = el('resume-heading').value;
    content.resume.subheading = el('resume-subheading').value;

    content.contact.heading = el('contact-heading').value;
    content.contact.subtext = el('contact-subtext').value;
    content.contact.email = el('contact-email').value;
    content.contact.whatsapp = el('contact-whatsapp').value;
    content.contact.whatsappLink = el('contact-whatsapp-link').value;
    content.contact.instagram = el('contact-instagram').value;
    content.contact.linkedin = el('contact-linkedin').value;
    content.footer.lines = readTextRepeater('footer-lines');
  }

  /**
   * Saves content to the server.
   * @returns {Promise<boolean>} True on success.
   */
  function save() {
    collect();
    setStatus('Saving...', '');
    return fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (d) {
            throw new Error(d.error || 'Save failed');
          });
        }
        setStatus('Saved', 'success');
        return true;
      })
      .catch(function (err) {
        setStatus(err.message, 'error');
        return false;
      });
  }

  function publish() {
    save().then(function (ok) {
      if (!ok) return;
      setStatus('Publishing...', '');
      fetch('/api/publish', { method: 'POST' })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (d) {
              throw new Error(d.error || 'Publish failed');
            });
          }
          return res.json();
        })
        .then(function (d) {
          setStatus(
            'Published ' + d.pages + ' pages locally. Push to GitHub for live site: git add data/content.json public/uploads/ && git push',
            'success',
          );
        })
        .catch(function (err) {
          setStatus(err.message, 'error');
        });
    });
  }

  function logout() {
    fetch('/api/logout', { method: 'POST' }).then(function () {
      window.location.href = '/admin/login.html';
    });
  }

  /* ---------------- Init ---------------- */

  function init() {
    initTabs();

    bindUpload('about-image-file', 'about-image', 'about-image-preview');
    bindUpload('p-card-image-file', 'p-card-image', 'p-card-image-preview');
    bindUpload('p-detail-hero-file', 'p-detail-hero', 'p-detail-hero-preview');
    bindUpload('c-thumbnail-file', 'c-thumbnail', 'c-thumbnail-preview');

    el('p-work-file').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      setStatus('Uploading work file...', '');
      el('p-work-file-name').textContent = 'Uploading ' + file.name + '...';
      var fd = new FormData();
      fd.append('file', file);
      fetch('/api/upload-file', { method: 'POST', body: fd })
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (d) {
              throw new Error(d.error || 'Upload failed');
            });
          }
          return res.json();
        })
        .then(function (d) {
          el('p-work-url').value = d.url;
          el('p-work-file-name').textContent = 'Uploaded: ' + d.url;
          if (!el('p-work-type').value) {
            el('p-work-type').value = /\.pdf$/i.test(d.url) ? 'pdf' : 'video';
          }
          setStatus('Work file uploaded', 'success');
        })
        .catch(function (err) {
          el('p-work-file-name').textContent = '';
          setStatus(err.message, 'error');
        });
    });

    el('add-paragraph').addEventListener('click', function () {
      content.about.paragraphs = readTextRepeater('about-paragraphs');
      content.about.paragraphs.push('');
      renderTextRepeater('about-paragraphs', content.about.paragraphs);
    });
    el('add-skill').addEventListener('click', function () {
      content.about.skills = readSkills();
      content.about.skills.push('');
      renderSkills(content.about.skills);
    });
    el('add-footer-line').addEventListener('click', function () {
      content.footer.lines = readTextRepeater('footer-lines');
      content.footer.lines.push('');
      renderTextRepeater('footer-lines', content.footer.lines);
    });

    el('add-project').addEventListener('click', addProject);
    el('modal-close').addEventListener('click', closeProjectModal);
    el('modal-cancel').addEventListener('click', closeProjectModal);
    el('modal-apply').addEventListener('click', applyProjectModal);

    el('add-client').addEventListener('click', addClient);
    el('client-modal-close').addEventListener('click', closeClientModal);
    el('client-modal-cancel').addEventListener('click', closeClientModal);
    el('client-modal-apply').addEventListener('click', applyClientModal);

    el('add-resume').addEventListener('click', addResume);

    el('save-btn').addEventListener('click', save);
    el('publish-btn').addEventListener('click', publish);
    el('logout-btn').addEventListener('click', logout);

    fetch('/api/content')
      .then(function (res) {
        if (res.status === 401) {
          window.location.href = '/admin/login.html';
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then(function (data) {
        content = data;
        populate();
      })
      .catch(function (err) {
        setStatus(err.message, 'error');
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
