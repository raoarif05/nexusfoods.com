/* Stackhouse: site behaviour only. All page content lives in the HTML files. */
(function () {
  'use strict';

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var currency = document.body.dataset.currency || '';
  var money = function (n) { return currency + n.toLocaleString(); };

  /* ---------- Light / dark theme ---------- */
  var root = document.documentElement;

  function isDark() {
    var theme = root.getAttribute('data-theme');
    if (theme) { return theme === 'dark'; }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  $('#themeToggle').addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Mobile menu ---------- */
  var bar = $('.bar');
  var menuToggle = $('#menuToggle');

  function setMenu(open) {
    bar.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  menuToggle.addEventListener('click', function () {
    setMenu(!bar.classList.contains('menu-open'));
  });

  $$('#mainNav a').forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 820) { setMenu(false); } });

  /* ---------- Toast message ---------- */
  var toastEl = $('#toast');
  var toastTimer;

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ---------- Cart (saved in the browser so it follows the visitor between pages) ---------- */
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem('cart') || '{}'); } catch (e) {}

  var drawer = $('#drawer');
  var list = $('#cartItems');
  var cartBtn = $('#cartBtn');

  function saveCart() {
    try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) {}
  }

  function renderCart() {
    var names = Object.keys(cart);
    var total = 0;
    var count = 0;

    list.innerHTML = '';

    if (!names.length) {
      list.innerHTML = '<li><small>Your cart is empty. Add something from the menu.</small></li>';
    }

    names.forEach(function (name) {
      var item = cart[name];
      total += item.price * item.qty;
      count += item.qty;

      var li = document.createElement('li');
      li.innerHTML =
        '<span></span>' +
        '<span class="qty">' +
          '<button type="button" data-change="-1" aria-label="Remove one">&minus;</button>' +
          '<span>' + item.qty + '</span>' +
          '<button type="button" data-change="1" aria-label="Add one">+</button>' +
        '</span>';
      li.firstChild.textContent = name + ' (' + money(item.price) + ')';
      li.dataset.name = name;
      list.appendChild(li);
    });

    $('#cartTotal').textContent = money(total);
    $('#cartCount').textContent = count;
    saveCart();
  }

  function openCart(open) {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
  }

  document.addEventListener('click', function (e) {
    var add = e.target.closest('.add');
    if (add) {
      var name = add.dataset.name;
      if (!cart[name]) { cart[name] = { price: Number(add.dataset.price), qty: 0 }; }
      cart[name].qty += 1;
      renderCart();
      toast(name + ' added to cart');
      cartBtn.classList.remove('bump');
      void cartBtn.offsetWidth;
      cartBtn.classList.add('bump');
      return;
    }

    var change = e.target.closest('[data-change]');
    if (change) {
      var key = change.closest('li').dataset.name;
      cart[key].qty += Number(change.dataset.change);
      if (cart[key].qty < 1) { delete cart[key]; }
      renderCart();
    }
  });

  cartBtn.addEventListener('click', function () { openCart(true); });
  $('#closeCart').addEventListener('click', function () { openCart(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { openCart(false); } });

  $('#checkout').addEventListener('click', function () {
    if (!Object.keys(cart).length) {
      toast('Add an item first');
      return;
    }
    cart = {};
    renderCart();
    openCart(false);
    toast('Order placed. Your food is being prepared.');
  });

  renderCart();

  /* ---------- Menu category filter ---------- */
  var chips = $$('.chip[data-filter]');
  var cards = $$('#menuGrid .card');

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.dataset.filter;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      cards.forEach(function (card) {
        card.hidden = filter !== 'All' && card.dataset.cat !== filter;
      });
    });
  });

  /* ---------- Contact form validation ---------- */
  var form = $('#contactForm');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      function check(id, isBad, message) {
        var value = $('#' + id).value.trim();
        $('#' + id + 'Error').textContent = isBad(value) ? message : '';
        if (isBad(value)) { valid = false; }
      }

      check('name', function (v) { return !v; }, 'Enter your name.');
      check('email', function (v) { return !/^\S+@\S+\.\S+$/.test(v); }, 'Enter a valid email address.');
      check('message', function (v) { return v.length < 10; }, 'Write at least 10 characters.');

      if (valid) {
        form.hidden = true;
        $('#formThanks').hidden = false;
      }
    });
  }
})();
