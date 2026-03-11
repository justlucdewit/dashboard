const date_el = document.getElementById('date');
const time_el = document.getElementById('time');
const weather_el = document.getElementById('weather');
const quick_links_grid_el = document.getElementById('quick-links-grid');
const news_list_el = document.getElementById('news-list');
const news_status_el = document.getElementById('news-status');
const news_feed_selector_el = document.getElementById('news-feed-selector');
const news_feed_button_el = document.getElementById('news-feed-button');
const news_feed_button_value_el = document.getElementById('news-feed-button-value');
const news_feed_menu_el = document.getElementById('news-feed-menu');
const news_refresh_indicator_el = document.getElementById('news-refresh-indicator');
const news_refresh_text_el = document.getElementById('news-refresh-text');
const agenda_month_label_el = document.getElementById('agenda-month-label');
const agenda_weekdays_el = document.getElementById('agenda-weekdays');
const agenda_grid_el = document.getElementById('agenda-grid');
const day_status_value_el = document.getElementById('day-status-value');
const day_status_bar_el = document.getElementById('day-status-bar');
const day_status_fill_el = document.getElementById('day-status-fill');
const notepad_input_el = document.getElementById('notepad-input');
const notepad_status_el = document.getElementById('notepad-status');
const pomodoro_phase_el = document.getElementById('pomodoro-phase');
const pomodoro_time_el = document.getElementById('pomodoro-time');
const pomodoro_progress_fill_el = document.getElementById('pomodoro-progress-fill');
const pomodoro_toggle_el = document.getElementById('pomodoro-toggle');
const pomodoro_reset_el = document.getElementById('pomodoro-reset');
const moon_next_phase_el = document.getElementById('moon-next-phase');
const moon_shadow_el = document.getElementById('moon-shadow');
const moon_phase_label_el = document.getElementById('moon-phase-label');
const moon_illumination_el = document.getElementById('moon-illumination');
const moon_quote_el = document.getElementById('moon-quote');
const moon_quote_progress_fill_el = document.getElementById('moon-quote-progress-fill');

const news_feeds = {
    hackernews: {
        label: 'Hacker News',
        status: 'Hacker News',
        load: async () => {
            const ids_response = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json');

            if (!ids_response.ok) {
                throw new Error('Failed to load story ids.');
            }

            const story_ids = await ids_response.json();
            const selected_ids = story_ids.slice(0, 12);
            const story_responses = await Promise.all(
                selected_ids.map((id) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`))
            );

            const stories = await Promise.all(
                story_responses.map(async (response) => {
                    if (!response.ok) {
                        return null;
                    }

                    return response.json();
                })
            );

            return stories
                .filter((story) => story && story.type === 'story' && story.title)
                .slice(0, 6)
                .map((story) => ({
                    title: story.title,
                    url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
                    meta: `${story.score ?? 0} points | ${story.descendants ?? 0} comments | ${story.by} | ${format_relative_time(story.time)}`,
                }));
        },
    },
    global: {
        label: 'Global news',
        status: 'r/worldnews',
        load: async () => {
            const response = await fetch('https://www.reddit.com/r/worldnews/new.json?limit=8');

            if (!response.ok) {
                throw new Error('Failed to load global news.');
            }

            const payload = await response.json();

            return payload.data.children
                .map(({ data }) => data)
                .filter((item) => item.title && !item.stickied)
                .slice(0, 6)
                .map((item) => ({
                    title: item.title,
                    url: item.url_overridden_by_dest || `https://www.reddit.com${item.permalink}`,
                    meta: `${item.score ?? 0} upvotes | ${item.num_comments ?? 0} comments | r/worldnews | ${format_relative_time(item.created_utc)}`,
                }));
        },
    },
    dutch: {
        label: 'Dutch news',
        status: 'r/thenetherlands',
        load: async () => {
            const response = await fetch('https://www.reddit.com/r/thenetherlands/new.json?limit=8');

            if (!response.ok) {
                throw new Error('Failed to load Dutch news.');
            }

            const payload = await response.json();

            return payload.data.children
                .map(({ data }) => data)
                .filter((item) => item.title && !item.stickied)
                .slice(0, 6)
                .map((item) => ({
                    title: item.title,
                    url: item.url_overridden_by_dest || `https://www.reddit.com${item.permalink}`,
                    meta: `${item.score ?? 0} upvotes | ${item.num_comments ?? 0} comments | r/thenetherlands | ${format_relative_time(item.created_utc)}`,
                }));
        },
    },
};

let active_news_feed = 'hackernews';
let last_news_refresh_at = null;
const agenda_weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const notepad_storage_key = 'workspace.notepad.content';
let notepad_save_timeout = null;
const pomodoro_duration_seconds = 25 * 60;
let pomodoro_remaining_seconds = pomodoro_duration_seconds;
let pomodoro_timer_id = null;
const default_document_title = document.title;
const synodic_month_days = 29.53058867;
const known_new_moon_utc = Date.UTC(2000, 0, 6, 18, 14, 0);
const quote_rotation_ms = 20000;
let moon_quotes = [];
let moon_quote_index = -1;
let moon_quote_started_at = Date.now();

const render_quick_links = (quick_links) => {
    quick_links_grid_el.innerHTML = quick_links
        .map(
            ({ title, meta, href, icon }) => `
                <a class="quick-link-card" href="${href}" target="_blank" rel="noreferrer">
                    <span class="quick-link-card__icon" aria-hidden="true">
                        <img src="${icon}" alt="">
                    </span>
                    <span class="quick-link-card__body">
                        <span class="quick-link-card__title">${title}</span>
                        <span class="quick-link-card__meta">${meta}</span>
                    </span>
                </a>
            `
        )
        .join('');
};

const initialize_quick_links = async () => {
    try {
        const response = await fetch('./data/quick-links.json');

        if (!response.ok) {
            throw new Error('Failed to load quick links.');
        }

        const quick_links = await response.json();
        render_quick_links(quick_links);
    } catch (error) {
        quick_links_grid_el.innerHTML = '<span class="quick-links__empty">Links unavailable.</span>';
    }
};

const set_news_status = (text) => {
    news_status_el.textContent = text;
};

const set_news_refresh_state = (is_refreshing) => {
    news_refresh_indicator_el.classList.toggle('is-refreshing', is_refreshing);
    news_refresh_text_el.textContent = is_refreshing ? 'Refreshing now' : get_news_refresh_text();
};

const get_news_refresh_text = () => {
    if (!last_news_refresh_at) {
        return 'Waiting for first refresh';
    }

    const diff_seconds = Math.max(0, Math.floor((Date.now() - last_news_refresh_at) / 1000));

    if (diff_seconds < 60) {
        return `Updated ${diff_seconds}s ago`;
    }

    return `Updated ${Math.floor(diff_seconds / 60)}m ago`;
};

const format_relative_time = (unix_time) => {
    const diff_seconds = Math.max(0, Math.floor(Date.now() / 1000) - unix_time);

    if (diff_seconds < 60) {
        return `${diff_seconds}s ago`;
    }

    if (diff_seconds < 3600) {
        return `${Math.floor(diff_seconds / 60)}m ago`;
    }

    if (diff_seconds < 86400) {
        return `${Math.floor(diff_seconds / 3600)}h ago`;
    }

    return `${Math.floor(diff_seconds / 86400)}d ago`;
};

const render_news = (stories) => {
    const fragment = document.createDocumentFragment();

    stories.forEach(({ title, url, meta }) => {
        const link = document.createElement('a');
        const title_el = document.createElement('span');
        const meta_el = document.createElement('span');

        link.className = 'news-item';
        link.href = url;
        link.target = '_blank';
        link.rel = 'noreferrer';

        title_el.className = 'news-item__title';
        title_el.textContent = title;

        meta_el.className = 'news-item__meta';
        meta_el.textContent = meta;

        link.append(title_el, meta_el);
        fragment.append(link);
    });

    news_list_el.replaceChildren(fragment);
};

const close_news_menu = () => {
    news_feed_menu_el.hidden = true;
    news_feed_button_el.setAttribute('aria-expanded', 'false');
};

const open_news_menu = () => {
    news_feed_menu_el.hidden = false;
    news_feed_button_el.setAttribute('aria-expanded', 'true');
};

const set_active_news_feed = (feed_key) => {
    active_news_feed = feed_key;
    news_feed_button_value_el.textContent = news_feeds[feed_key].label;

    news_feed_menu_el.querySelectorAll('.news-feed-menu__item').forEach((item) => {
        item.classList.toggle('is-active', item.dataset.feed === feed_key);
    });
};

const initialize_news = async () => {
    try {
        set_news_refresh_state(true);
        set_news_status('Loading...');
        const feed = news_feeds[active_news_feed];
        const stories = await feed.load();

        if (!stories.length) {
            throw new Error('No stories available.');
        }

        render_news(stories);
        set_news_status(feed.status);
        last_news_refresh_at = Date.now();
        set_news_refresh_state(false);
    } catch (error) {
        news_list_el.innerHTML = '<span class="panel-empty">News unavailable.</span>';
        set_news_status('Offline');
        set_news_refresh_state(false);
    }
};

news_feed_button_el.addEventListener('click', () => {
    if (news_feed_menu_el.hidden) {
        open_news_menu();
        return;
    }

    close_news_menu();
});

news_feed_menu_el.addEventListener('click', (event) => {
    const button = event.target.closest('.news-feed-menu__item');

    if (!button) {
        return;
    }

    set_active_news_feed(button.dataset.feed);
    close_news_menu();
    initialize_news();
});

document.addEventListener('click', (event) => {
    if (!news_feed_selector_el.contains(event.target)) {
        close_news_menu();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        close_news_menu();
    }
});

const update_time = () => {
    const now = new Date();

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[now.getDay()];

    const date = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    date_el.textContent = `${day} ${date}/${month}/${year}`;
    time_el.textContent = `${hours}:${minutes}:${seconds}`;
};

const format_timer = (total_seconds) => {
    const minutes = Math.floor(total_seconds / 60)
        .toString()
        .padStart(2, '0');
    const seconds = (total_seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const update_pomodoro_title = () => {
    if (pomodoro_timer_id) {
        document.title = `${format_timer(pomodoro_remaining_seconds)} • Workspace`;
        return;
    }

    document.title = default_document_title;
};

const render_pomodoro = () => {
    pomodoro_time_el.textContent = format_timer(pomodoro_remaining_seconds);
    pomodoro_phase_el.textContent = pomodoro_timer_id ? 'Focus running' : 'Ready';
    pomodoro_toggle_el.textContent = pomodoro_timer_id ? 'Pause' : 'Start';

    const progress = ((pomodoro_duration_seconds - pomodoro_remaining_seconds) / pomodoro_duration_seconds) * 100;
    pomodoro_progress_fill_el.style.width = `${Math.max(0, progress)}%`;
    update_pomodoro_title();
};

const stop_pomodoro = () => {
    if (pomodoro_timer_id) {
        clearInterval(pomodoro_timer_id);
        pomodoro_timer_id = null;
    }

    render_pomodoro();
};

const tick_pomodoro = () => {
    if (pomodoro_remaining_seconds <= 0) {
        stop_pomodoro();
        pomodoro_phase_el.textContent = 'Finished';
        document.title = `Done • Workspace`;
        return;
    }

    pomodoro_remaining_seconds -= 1;
    render_pomodoro();
};

const toggle_pomodoro = () => {
    if (pomodoro_timer_id) {
        stop_pomodoro();
        return;
    }

    if (pomodoro_remaining_seconds <= 0) {
        pomodoro_remaining_seconds = pomodoro_duration_seconds;
    }

    pomodoro_timer_id = setInterval(tick_pomodoro, 1000);
    render_pomodoro();
};

const reset_pomodoro = () => {
    stop_pomodoro();
    pomodoro_remaining_seconds = pomodoro_duration_seconds;
    pomodoro_phase_el.textContent = 'Ready';
    render_pomodoro();
};

const render_agenda = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const first_day = new Date(year, month, 1);
    const last_day = new Date(year, month + 1, 0);
    const start_offset = (first_day.getDay() + 6) % 7;
    const days_in_month = last_day.getDate();
    const previous_month_last_day = new Date(year, month, 0).getDate();
    const total_cells = Math.ceil((start_offset + days_in_month) / 7) * 7;

    agenda_month_label_el.textContent = now.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });

    agenda_weekdays_el.replaceChildren(
        ...agenda_weekdays.map((label) => {
            const el = document.createElement('span');
            el.className = 'agenda-weekday';
            el.textContent = label;
            return el;
        })
    );

    const fragment = document.createDocumentFragment();

    for (let index = 0; index < total_cells; index += 1) {
        const day_el = document.createElement('span');
        day_el.className = 'agenda-day';

        const day_number = index - start_offset + 1;
        let display_number = day_number;

        if (day_number < 1) {
            display_number = previous_month_last_day + day_number;
            day_el.classList.add('is-outside');
        } else if (day_number > days_in_month) {
            display_number = day_number - days_in_month;
            day_el.classList.add('is-outside');
        } else if (day_number === today) {
            day_el.classList.add('is-today');
        }

        day_el.textContent = display_number;
        fragment.append(day_el);
    }

    agenda_grid_el.replaceChildren(fragment);
};

const update_day_status = () => {
    const now = new Date();
    const day = now.getDay();
    const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const work_start = 9 * 3600;
    const work_end = 17 * 3600;

    if (day === 0 || day === 6) {
        day_status_value_el.textContent = 'Weekend';
        day_status_bar_el.hidden = true;
        return;
    }

    if (seconds < work_start) {
        day_status_value_el.textContent = 'Pre-work';
        day_status_bar_el.hidden = true;
        return;
    }

    if (seconds >= work_end) {
        day_status_value_el.textContent = 'Post-work';
        day_status_bar_el.hidden = true;
        return;
    }

    const progress = ((seconds - work_start) / (work_end - work_start)) * 100;
    day_status_value_el.textContent = `${progress.toFixed(2).replace('.', ',')}% of work day`;
    day_status_bar_el.hidden = false;
    day_status_fill_el.style.width = `${progress}%`;
};

const set_notepad_status = (text) => {
    notepad_status_el.textContent = text;
};

const save_notepad = () => {
    try {
        localStorage.setItem(notepad_storage_key, notepad_input_el.value);
        set_notepad_status('Saved locally');
    } catch (error) {
        set_notepad_status('Save failed');
    }
};

const schedule_notepad_save = () => {
    set_notepad_status('Saving...');

    if (notepad_save_timeout) {
        clearTimeout(notepad_save_timeout);
    }

    notepad_save_timeout = setTimeout(() => {
        save_notepad();
    }, 250);
};

const initialize_notepad = () => {
    try {
        const saved_content = localStorage.getItem(notepad_storage_key);

        if (saved_content) {
            notepad_input_el.value = saved_content;
        }

        set_notepad_status('Saved locally');
    } catch (error) {
        set_notepad_status('Storage unavailable');
    }

    notepad_input_el.addEventListener('input', schedule_notepad_save);
    window.addEventListener('beforeunload', save_notepad);
};

const get_moon_data = () => {
    const now = Date.now();
    const days_since_known_new_moon = (now - known_new_moon_utc) / 86400000;
    const age = ((days_since_known_new_moon % synodic_month_days) + synodic_month_days) % synodic_month_days;
    const normalized_age = age / synodic_month_days;
    const illumination = (1 - Math.cos(normalized_age * Math.PI * 2)) / 2;

    const phase_definitions = [
        { name: 'New Moon', start: 0, next: 'First Quarter' },
        { name: 'Waxing Crescent', start: 0.03, next: 'First Quarter' },
        { name: 'First Quarter', start: 0.22, next: 'Full Moon' },
        { name: 'Waxing Gibbous', start: 0.28, next: 'Full Moon' },
        { name: 'Full Moon', start: 0.47, next: 'Last Quarter' },
        { name: 'Waning Gibbous', start: 0.53, next: 'Last Quarter' },
        { name: 'Last Quarter', start: 0.72, next: 'New Moon' },
        { name: 'Waning Crescent', start: 0.78, next: 'New Moon' },
    ];

    let current_phase = phase_definitions[0];

    phase_definitions.forEach((phase) => {
        if (normalized_age >= phase.start) {
            current_phase = phase;
        }
    });

    const major_phase_targets = {
        'New Moon': 0,
        'First Quarter': 0.25,
        'Full Moon': 0.5,
        'Last Quarter': 0.75,
    };

    let next_target = major_phase_targets[current_phase.next];

    if (normalized_age >= next_target) {
        next_target += 1;
    }

    const days_until_next = (next_target - normalized_age) * synodic_month_days;

    return {
        age,
        illumination,
        current_phase: current_phase.name,
        next_phase: current_phase.next,
        days_until_next,
    };
};

const render_moon_phase = () => {
    const moon = get_moon_data();
    const progress = moon.age / synodic_month_days;
    const shadow_shift = Math.cos(progress * Math.PI * 2) * 100;

    moon_phase_label_el.textContent = moon.current_phase;
    moon_illumination_el.textContent = `${Math.round(moon.illumination * 100)}% illuminated`;
    moon_next_phase_el.textContent = `${moon.next_phase} in ${Math.max(0, Math.ceil(moon.days_until_next))}d`;
    moon_shadow_el.style.transform = `translateX(${shadow_shift}%)`;

    if (progress > 0.5) {
        moon_shadow_el.style.boxShadow = 'inset -32px 0 40px rgba(0, 0, 0, 0.42)';
        return;
    }

    moon_shadow_el.style.boxShadow = 'inset 32px 0 40px rgba(0, 0, 0, 0.42)';
};

const render_moon_quote = () => {
    if (!moon_quotes.length) {
        moon_quote_el.textContent = 'Ship small things. Keep the magic in motion.';
        moon_quote_progress_fill_el.style.width = '0%';
        return;
    }

    moon_quote_el.innerHTML = moon_quotes[moon_quote_index].text;
    moon_quote_started_at = Date.now();
    moon_quote_progress_fill_el.style.width = '0%';
};

const pick_next_moon_quote_index = () => {
    if (moon_quotes.length <= 1) {
        return 0;
    }

    let next_index = moon_quote_index;

    while (next_index === moon_quote_index) {
        next_index = Math.floor(Math.random() * moon_quotes.length);
    }

    return next_index;
};

const update_moon_quote_progress = () => {
    const elapsed = Date.now() - moon_quote_started_at;
    const progress = Math.min(100, (elapsed / quote_rotation_ms) * 100);
    moon_quote_progress_fill_el.style.width = `${progress}%`;

    if (elapsed < quote_rotation_ms || moon_quotes.length <= 1) {
        return;
    }

    moon_quote_index = pick_next_moon_quote_index();
    render_moon_quote();
};

const initialize_moon_quote = async () => {
    try {
        const response = await fetch('./data/quotes.json');

        if (!response.ok) {
            throw new Error('Failed to load quotes.');
        }

        moon_quotes = await response.json();
        moon_quote_index = pick_next_moon_quote_index();
        render_moon_quote();
    } catch (error) {
        moon_quote_el.textContent = 'Ship small things. Keep the magic in motion.';
        moon_quote_progress_fill_el.style.width = '0%';
    }
};

const initialize_pomodoro = () => {
    pomodoro_toggle_el.addEventListener('click', toggle_pomodoro);
    pomodoro_reset_el.addEventListener('click', reset_pomodoro);
    render_pomodoro();
};

const format_temperature = (temperature) => `${Math.round(temperature)}°C`;

const get_fallback_city = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone?.split('/').pop()?.replace(/_/g, ' ') ?? 'Unknown location';
};

const set_weather_text = (text) => {
    weather_el.textContent = text;
};

const fetch_city_name = async (latitude, longitude) => {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10`
    );

    if (!response.ok) {
        throw new Error('Failed to reverse geocode location.');
    }

    const data = await response.json();
    const address = data.address ?? {};

    return (
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        get_fallback_city()
    );
};

const fetch_weather = async (latitude, longitude) => {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&daily=temperature_2m_min,temperature_2m_max&forecast_days=1&timezone=auto`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch weather.');
    }

    return response.json();
};

const update_weather = async (latitude, longitude) => {
    try {
        const [city, weather] = await Promise.all([
            fetch_city_name(latitude, longitude).catch(() => get_fallback_city()),
            fetch_weather(latitude, longitude),
        ]);

        const current_temperature = weather.current?.temperature_2m;
        const minimum_temperature = weather.daily?.temperature_2m_min?.[0];
        const maximum_temperature = weather.daily?.temperature_2m_max?.[0];

        if (
            current_temperature === undefined ||
            minimum_temperature === undefined ||
            maximum_temperature === undefined
        ) {
            throw new Error('Incomplete weather data.');
        }

        set_weather_text(
            `${city} • ${format_temperature(minimum_temperature)} | ${format_temperature(current_temperature)} | ${format_temperature(maximum_temperature)}`
        );
    } catch (error) {
        set_weather_text(`${get_fallback_city()} • Weather unavailable`);
    }
};

const initialize_weather = () => {
    if (!navigator.geolocation) {
        set_weather_text(`${get_fallback_city()} • Weather unavailable`);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
            update_weather(coords.latitude, coords.longitude);
        },
        () => {
            set_weather_text(`${get_fallback_city()} • Location unavailable`);
        },
        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
        }
    );
};

initialize_quick_links();
set_active_news_feed(active_news_feed);
initialize_news();
render_agenda();
update_day_status();
initialize_notepad();
initialize_pomodoro();
render_moon_phase();
initialize_moon_quote();
update_time();
initialize_weather();
setInterval(update_time, 1000);
setInterval(initialize_news, 300000);
setInterval(render_moon_phase, 3600000);
setInterval(update_moon_quote_progress, 100);
setInterval(() => {
    if (!news_refresh_indicator_el.classList.contains('is-refreshing')) {
        news_refresh_text_el.textContent = get_news_refresh_text();
    }
}, 1000);
setInterval(update_day_status, 1000);
