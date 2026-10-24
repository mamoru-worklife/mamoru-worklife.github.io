/* =====================================================================
   まもる 参加特典サイト — main.js(全ページ共通)
   HTMLの data- 属性を読んで動く。特典を足しても、このファイルは触らない。
   1) 保存できるかの確認(できない時は案内を出す)
   2) チェックの保存と復元   <body data-tokuten="t02"> + <input data-check="名前">
   3) チェックのリセット     <button data-reset>
   4) 文例のコピー           <button data-copy="コピーする要素のid">
   5) バックアップと復元     backup.html の id="backup-…" の要素
   6) LINEの中のブラウザで開いた時の案内  id="notice-line"
   7) アニメーションの開始   class="anim"(画面に入ったら .is-in を付ける)
   ===================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var PREFIX = "mamoru:";   // 同じGitHubアカウントの別サイトと混ざらないよう、キーの頭に付ける
  var VERSION = "v1";       // 保存の形を大きく変える時だけ v2 にする

  function $(id) { return document.getElementById(id); }
  function show(id) { var el = $(id); if (el) el.hidden = false; }

  /* ---- 1) 保存できるか ---- */
  var storage = null;
  try {
    var testKey = PREFIX + "test";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    storage = window.localStorage;
  } catch (e) {
    storage = null;
  }
  if (!storage) show("notice-storage");

  function readJSON(key) {
    if (!storage) return null;
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function writeJSON(key, obj) {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(obj));
      return true;
    } catch (e) {
      show("notice-storage");
      return false;
    }
  }
  function removeKey(key) {
    if (!storage) return;
    try { storage.removeItem(key); } catch (e) { /* 消せなくても画面は続ける */ }
  }

  /* ---- 2) チェックの保存と復元 ---- */
  var tokuten = document.body.getAttribute("data-tokuten");
  var checkKey = tokuten ? PREFIX + tokuten + ":" + VERSION : null;
  var checks = document.querySelectorAll("input[data-check]");

  // 並び順ではなく data-check の名前で保存する(後で項目を足しても、ずれない)
  function saveChecks() {
    var data = {};
    checks.forEach(function (box) {
      if (box.checked) data[box.getAttribute("data-check")] = true;
    });
    writeJSON(checkKey, data);
  }
  if (checkKey && checks.length) {
    var saved = readJSON(checkKey) || {};
    checks.forEach(function (box) {
      box.checked = saved[box.getAttribute("data-check")] === true;
      box.addEventListener("change", saveChecks);
    });
  }

  /* ---- 3) チェックのリセット(この特典の分だけ) ---- */
  document.querySelectorAll("[data-reset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!window.confirm("この特典のチェックを、すべて外しますか?")) return;
      checks.forEach(function (box) { box.checked = false; });
      if (checkKey) removeKey(checkKey);
    });
  });

  /* ---- 4) 文例のコピー ---- */
  // LINEの中のブラウザなどで新しいコピー機能が使えない時は、古い方法で試す
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { done(true); },
        function () { done(fallbackCopy(text)); }
      );
    } else {
      done(fallbackCopy(text));
    }
  }
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener("click", function () {
      var target = $(btn.getAttribute("data-copy"));
      if (!target) return;
      var isField = target.tagName === "TEXTAREA" || target.tagName === "INPUT";
      var text = isField ? target.value : target.innerText.trim();
      copyText(text, function (ok) {
        btn.textContent = ok ? "コピーしました" : "コピーできませんでした。長押しで選んでください";
        btn.classList.toggle("is-done", ok);
        window.setTimeout(function () {
          btn.textContent = label;
          btn.classList.remove("is-done");
        }, 2000);
      });
    });
  });

  /* ---- 5) バックアップと復元(backup.html) ---- */
  // 保存しているチェックを集め、短い文字列(バックアップコード)にする
  function collectAll() {
    var all = {};
    if (!storage) return all;
    for (var i = 0; i < storage.length; i++) {
      var key = storage.key(i);
      if (key && key.indexOf(PREFIX) === 0 && key !== PREFIX + "test") {
        var value = readJSON(key);
        if (value) all[key.slice(PREFIX.length)] = value;
      }
    }
    return all;
  }
  function encode(obj) {
    return window.btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  }
  function decode(code) {
    return JSON.parse(decodeURIComponent(escape(window.atob(code.replace(/\s/g, "")))));
  }
  // 復元する。戻した特典の数を返す。コードが壊れている時は -1
  function restoreAll(code) {
    var data;
    try { data = decode(code); } catch (e) { return -1; }
    if (!data || typeof data !== "object") return -1;
    var count = 0;
    Object.keys(data).forEach(function (name) {
      // 形がおかしいものは戻さない(例: "t02:v1")
      if (/^[a-z0-9-]+:v\d+$/.test(name) && data[name] && typeof data[name] === "object") {
        if (writeJSON(PREFIX + name, data[name])) count++;
      }
    });
    return count;
  }

  var codeField = $("backup-code");
  var urlField = $("backup-url");
  var restoreField = $("restore-input");
  var status = $("restore-status");

  function setStatus(text, isError) {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("is-error", !!isError);
  }
  function refreshBackup() {
    if (!codeField) return;
    var all = collectAll();
    var code = encode(all);
    codeField.value = code;
    if (urlField) {
      urlField.value = location.href.split("#")[0] + "#restore=" + encodeURIComponent(code);
    }
    var empty = $("backup-empty");
    if (empty) empty.hidden = Object.keys(all).length > 0;
  }

  if (codeField) {
    refreshBackup();

    // 復元用URLで開いた時は、コードを入れておく(押すまで復元はしない)
    var fillFromHash = function () {
      var match = location.hash.match(/^#restore=(.+)$/);
      if (!match || !restoreField) return;
      try { restoreField.value = decodeURIComponent(match[1]); } catch (e) { restoreField.value = match[1]; }
      setStatus("復元用URLのコードを入れました。「復元する」を押すと、チェックが戻ります。");
    };
    fillFromHash();
    window.addEventListener("hashchange", fillFromHash);

    var restoreBtn = $("restore-btn");
    if (restoreBtn) {
      restoreBtn.addEventListener("click", function () {
        var code = restoreField ? restoreField.value.trim() : "";
        if (!code) { setStatus("バックアップコードを貼り付けてください。", true); return; }
        if (!storage) { setStatus("このブラウザでは保存できないため、復元できません。", true); return; }
        var count = restoreAll(code);
        if (count < 0) {
          setStatus("コードを読み取れませんでした。最後まで貼り付けられているか確かめてください。", true);
        } else {
          setStatus("復元しました(" + count + "つの特典)。各特典のページを開くと、チェックが戻っています。");
          refreshBackup();
          if (location.hash) history.replaceState(null, "", location.pathname + location.search);
        }
      });
    }

    var clearBtn = $("clear-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (!window.confirm("すべての特典のチェックを消します。元に戻せません。よろしいですか?")) return;
        Object.keys(collectAll()).forEach(function (name) { removeKey(PREFIX + name); });
        refreshBackup();
        setStatus("すべてのチェックを消しました。");
      });
    }
  }

  /* ---- 6) LINEの中のブラウザで開いた時の案内 ---- */
  // LINEの中のブラウザは、Safari・Chromeと保存場所が別になり、チェックが消えやすい
  var lineNotice = $("notice-line");
  if (lineNotice && / Line\//i.test(navigator.userAgent)) {
    var openLink = $("open-external");
    if (openLink) {
      var base = location.href.split("#")[0];
      openLink.href = base + (base.indexOf("?") < 0 ? "?" : "&") + "openExternalBrowser=1";
    }
    lineNotice.hidden = false;
  }

  /* ---- 7) アニメーションの開始 ---- */
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animEls = document.querySelectorAll(".anim");
  if (animEls.length && "IntersectionObserver" in window && !prefersReduced) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    animEls.forEach(function (el) { obs.observe(el); });
  } else {
    animEls.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
