(function () {
  'use strict';

  function updateUpcomingEvents() {
    var list = document.querySelector('#daily .daily-event-list');
    if (!list) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var count = 0;

    list.querySelectorAll('.daily-event[data-end]').forEach(function (item) {
      var endDate = new Date(item.getAttribute('data-end') + 'T23:59:59');
      var upcoming = !Number.isNaN(endDate.getTime()) && endDate >= today;
      item.hidden = !upcoming;
      item.setAttribute('aria-hidden', upcoming ? 'false' : 'true');
      if (upcoming) count += 1;
    });

    var badge = document.querySelector('#daily [data-daily-event-count]');
    if (badge) {
      badge.textContent = String(count).padStart(2, '0');
      badge.setAttribute('aria-label', count + ' 场即将举行的活动');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateUpcomingEvents, { once: true });
  } else {
    updateUpcomingEvents();
  }
})();
