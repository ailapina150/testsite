// ============================================================
// _worker.js — Cloudflare Worker для обработки заявок
// ============================================================

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // ============================================================
        // 1. ОБРАБОТКА POST /api/submit
        // ============================================================
        if (request.method === 'POST' && url.pathname === '/api/submit') {
            try {
                const data = await request.json();
                const { name, phone, email } = data;

                // Валидация
                if (!name || name.trim().length < 2) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Имя должно содержать минимум 2 символа'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                if (!phone || phone.replace(/\D/g, '').length < 11) {
                return new Response(JSON.stringify({
                        success: false,
                        error: 'Введите корректный номер телефона'
                }), {
                        status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
                }

        // ============================================================
                // ОТПРАВКА НА ПОЧТУ (Formspree)
        // ============================================================
                // ID формы Formspree (можно переопределить через env.FORMSPREE_ID)
                const formspreeId = env.FORMSPREE_ID || 'mppzwejy';

                // Автор заявки (ФИО владельца сайта) — можно переопределить через env.AUTHOR_NAME
                const author = env.AUTHOR_NAME || 'Лапина Анна Ивановна';

                // Текст заявки по ТЗ
                const messageText =
                    `Новая заявка с сайта ${url.origin}\n` +
                    `Автор: ${author}\n\n` +
                    `Имя: ${name}\n` +
                    `Телефон: ${phone}\n` +
                    (email ? `Email: ${email}\n` : '');

                const formspreeResponse = await fetch(`https://formspree.io/f/${formspreeId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        phone: phone,
                        email: email || '',
                        message: messageText,
                        _subject: `Новая заявка с сайта ${url.origin}`,
                        _gotcha: ''
                    })
                });

                // Проверяем ответ Formspree
                if (!formspreeResponse.ok) {
                    const fsError = await formspreeResponse.text();
                    console.error('❌ Ошибка Formspree:', fsError);
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Не удалось отправить заявку на почту'
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
    }

                // ============================================================
                // УСПЕШНЫЙ ОТВЕТ
                // ============================================================
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Заявка успешно отправлена!'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            } catch (error) {
                console.error('❌ Ошибка:', error);
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Внутренняя ошибка сервера'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // ============================================================
        // 2. ВСЕ ОСТАЛЬНЫЕ ЗАПРОСЫ — СТАТИКА
        // ============================================================
        return env.ASSETS.fetch(request);
    }
};