(function () {
    'use strict';

    var STORAGE_KEY = 'theme-preference';
    var LIGHT = 'light';
    var DARK = 'dark';

    function getStoredTheme() {
        return localStorage.getItem(STORAGE_KEY);
    }

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? LIGHT : DARK;
    }

    function applyTheme(theme) {
        if (theme === LIGHT) {
            document.documentElement.setAttribute('data-theme', LIGHT);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme') === LIGHT ? LIGHT : DARK;
        var next = current === LIGHT ? DARK : LIGHT;
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    }

    document.addEventListener('DOMContentLoaded', function () {
        applyTheme(getStoredTheme() || getSystemTheme());

        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', toggleTheme);
        }
    });

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
        if (!getStoredTheme()) {
            applyTheme(e.matches ? LIGHT : DARK);
        }
    });
})();
